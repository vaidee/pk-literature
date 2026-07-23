import { Inject, Injectable } from "@nestjs/common";
import { sql, type Kysely } from "kysely";
import type { Facet, SearchResult } from "@pk-literature/domain-types";
import { KYSELY } from "../database/database.module";
import type { Database } from "../database/database.types";
import { BookCardBuilder } from "../common/book-card-builder";
import type { SearchQueryDto } from "./dto/search-query.dto";

// SPEC-08 §13 — books need at least this trigram similarity to count
// as a fuzzy author/publisher/theme/description match at all (below
// this, similarity() still returns a small positive number for almost
// any two strings, which would otherwise leak irrelevant results in).
const FUZZY_THRESHOLD = 0.35;

// Found by testing this against real data, not a hypothetical:
// Postgres's ts_rank() does not reliably return exactly 0 for a
// genuinely non-matching tsvector/tsquery pair — it can return a tiny
// floating-point residue (observed: ~8e-19) that survived a bare
// `relevance > 0` check and made every published book "match" every
// query, including nonsense ones. Fixed at the source below by gating
// the ts_rank term behind `@@` (the correct, discrete "does this
// actually match" operator — ts_rank() is only for ordering among rows
// that already do). This floor is defense in depth on top of that fix,
// set far above realistic float noise (~1e-15) and far below the
// smallest genuine signal contribution (the weakest plausible full-text
// match: a low ts_rank around 0.01 still scores 80 * 0.01 = 0.8... —
// see WEIGHTS.fullText below — so this stays well under that, too).
const MIN_RELEVANCE = 0.001;

// SPEC-08 §12's weights, applied as multipliers over each signal's own
// 0..1-ish score (ts_rank, similarity()) or as flat bonuses (exact
// title/ISBN match). Popularity (50) and Editorial Boost (40) are not
// implemented — there's no view/purchase-count or editor-set boost
// field anywhere in the catalog schema to derive them from; SPEC-08
// itself lists both under §19 "Trending" as "Future feature" for the
// popularity half, and nothing in SPEC-02/SPEC-03 defines an editorial
// boost value today. Both stay at 0 rather than a placeholder query.
const WEIGHTS = {
  exactTitle: 100,
  isbn: 95,
  fullText: 80, // scales ts_rank, which already weights title (A) over subtitle (B) internally
  author: 90,
  publisher: 80,
  theme: 70,
  description: 60,
  personalization: 30,
} as const;

interface PersonalizationSignals {
  authorIds: string[];
  themeIds: string[];
  publisherIds: string[];
}

// No jest unit test for this service — same reasoning as
// apps/api-feed/src/feed/feed.service.ts and
// apps/api-publisher-import's staging-books.service.ts: the ranking
// query's raw `sql` CTEs (weighted GREATEST() over exact/fuzzy/
// full-text/personalization signals, the facet GROUP BYs) aren't
// meaningfully testable against a mocked Kysely. Validated for real
// against local Postgres: exact title match outranked a fuzzy
// author-name match on an unrelated field; an ISBN query found its
// book even with an unrelated title; a trigram-fuzzy author name
// ("jeyamohn" for "Jeyamohan") matched above the 0.35 threshold and a
// clearly-unrelated name didn't; filters (publisherId/language)
// correctly narrowed both results and facet counts; personalization
// correctly boosted a book sharing a liked book's author once the
// feature flag was on, and had no effect with it off.
@Injectable()
export class SearchService {
  constructor(
    @Inject(KYSELY) private readonly db: Kysely<Database>,
    private readonly cardBuilder: BookCardBuilder,
  ) {}

  async search(dto: SearchQueryDto, anonymousId: string | null): Promise<SearchResult> {
    const q = normalizeQuery(dto.q);
    const personalization =
      process.env.FEATURE_PERSONALIZED_RANKING === "true" && anonymousId
        ? await this.personalizationSignals(anonymousId)
        : null;

    const [ids, totalItems, facets] = await Promise.all([
      this.matchedBookIds(q, dto, personalization, dto.pageSize, dto.offset),
      this.countMatches(q, dto, personalization),
      this.computeFacets(q, dto, personalization),
    ]);

    const items = await this.cardBuilder.build(ids);

    return {
      items,
      facets,
      page: dto.page,
      pageSize: dto.pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / dto.pageSize),
    };
  }

  private filterClause(dto: SearchQueryDto) {
    const clauses = [sql`b.status = 'published'`];
    if (dto.publisherId) clauses.push(sql`b.publisher_id = ${dto.publisherId}`);
    if (dto.authorId) {
      clauses.push(
        sql`EXISTS (SELECT 1 FROM catalog.work_authors wa WHERE wa.work_id = b.work_id AND wa.author_id = ${dto.authorId})`,
      );
    }
    if (dto.themeId) {
      clauses.push(
        sql`EXISTS (SELECT 1 FROM catalog.work_themes wt WHERE wt.work_id = b.work_id AND wt.theme_id = ${dto.themeId})`,
      );
    }
    if (dto.genreId) {
      clauses.push(
        sql`EXISTS (SELECT 1 FROM catalog.work_genres wg WHERE wg.work_id = b.work_id AND wg.genre_id = ${dto.genreId})`,
      );
    }
    if (dto.language) clauses.push(sql`b.language = ${dto.language}`);
    if (dto.availability) {
      clauses.push(
        sql`EXISTS (SELECT 1 FROM catalog.inventory inv WHERE inv.book_id = b.id AND inv.availability = ${dto.availability})`,
      );
    }
    return sql.join(clauses, sql` AND `);
  }

  private relevanceExpr(q: string, personalization: PersonalizationSignals | null) {
    const personalizationTerm =
      personalization && (personalization.authorIds.length || personalization.themeIds.length || personalization.publisherIds.length)
        ? sql`,
      CASE WHEN
        (${personalization.authorIds.length > 0 ? sql`EXISTS (SELECT 1 FROM catalog.work_authors wa4 WHERE wa4.work_id = b.work_id AND wa4.author_id IN (${sql.join(personalization.authorIds)}))` : sql`FALSE`})
        OR (${personalization.themeIds.length > 0 ? sql`EXISTS (SELECT 1 FROM catalog.work_themes wt4 WHERE wt4.work_id = b.work_id AND wt4.theme_id IN (${sql.join(personalization.themeIds)}))` : sql`FALSE`})
        OR (${personalization.publisherIds.length > 0 ? sql`b.publisher_id IN (${sql.join(personalization.publisherIds)})` : sql`FALSE`})
      THEN ${WEIGHTS.personalization} ELSE 0 END`
        : sql``;

    return sql`GREATEST(
      CASE WHEN lower(b.title) = lower(${q}) THEN ${WEIGHTS.exactTitle} ELSE 0 END,
      CASE WHEN b.isbn13 = ${q} THEN ${WEIGHTS.isbn} ELSE 0 END,
      CASE WHEN b.search_vector @@ plainto_tsquery('simple', ${q})
        THEN ts_rank(b.search_vector, plainto_tsquery('simple', ${q})) * ${WEIGHTS.fullText}
        ELSE 0 END,
      COALESCE((
        SELECT MAX(similarity(a.canonical_name, ${q}))
        FROM catalog.work_authors wa
        JOIN catalog.authors a ON a.id = wa.author_id
        WHERE wa.work_id = b.work_id AND similarity(a.canonical_name, ${q}) > ${FUZZY_THRESHOLD}
      ), 0) * ${WEIGHTS.author},
      COALESCE((
        SELECT similarity(p.name, ${q})
        FROM catalog.publishers p
        WHERE p.id = b.publisher_id AND similarity(p.name, ${q}) > ${FUZZY_THRESHOLD}
      ), 0) * ${WEIGHTS.publisher},
      COALESCE((
        SELECT MAX(similarity(t.name, ${q}))
        FROM catalog.work_themes wt
        JOIN catalog.themes t ON t.id = wt.theme_id
        WHERE wt.work_id = b.work_id AND similarity(t.name, ${q}) > ${FUZZY_THRESHOLD}
      ), 0) * ${WEIGHTS.theme},
      COALESCE((
        SELECT similarity(w.summary, ${q})
        FROM catalog.works w
        WHERE w.id = b.work_id AND w.summary IS NOT NULL AND similarity(w.summary, ${q}) > ${FUZZY_THRESHOLD}
      ), 0) * ${WEIGHTS.description}
      ${personalizationTerm}
    )`;
  }

  /**
   * `WITH matched AS (...)` shared by every query below — a book only
   * counts as a result (and only contributes to facet counts/totals)
   * once it clears `relevance > MIN_RELEVANCE`. Without that filter, a query that
   * matched nothing would silently fall back to an arbitrary page of
   * unrelated published books (every relevance term is 0, but they'd
   * still sort and paginate as if they mattered) — SPEC-08 has no
   * "zero relevant matches" fallback-to-anything behavior.
   */
  private matchedCte(q: string, dto: SearchQueryDto, personalization: PersonalizationSignals | null) {
    return sql`WITH matched AS (
      SELECT b.id, b.publisher_id, b.work_id, b.language,
        ${this.relevanceExpr(q, personalization)} AS relevance
      FROM catalog.books b
      WHERE ${this.filterClause(dto)}
    )`;
  }

  private async matchedBookIds(
    q: string,
    dto: SearchQueryDto,
    personalization: PersonalizationSignals | null,
    limit: number,
    offset: number,
  ): Promise<string[]> {
    const result = await sql<{ id: string }>`
      ${this.matchedCte(q, dto, personalization)}
      SELECT id FROM matched WHERE relevance > ${MIN_RELEVANCE}
      ORDER BY relevance DESC, id
      LIMIT ${limit} OFFSET ${offset}
    `.execute(this.db);
    return result.rows.map((r) => r.id);
  }

  private async countMatches(q: string, dto: SearchQueryDto, personalization: PersonalizationSignals | null): Promise<number> {
    const result = await sql<{ count: string }>`
      ${this.matchedCte(q, dto, personalization)}
      SELECT COUNT(*) as count FROM matched WHERE relevance > ${MIN_RELEVANCE}
    `.execute(this.db);
    return Number(result.rows[0]?.count ?? 0);
  }

  private async computeFacets(
    q: string,
    dto: SearchQueryDto,
    personalization: PersonalizationSignals | null,
  ): Promise<Facet[]> {
    const cte = this.matchedCte(q, dto, personalization);

    const [publishers, themes, genres, languages, availability] = await Promise.all([
      sql<{ value: string; label: string; count: string }>`
        ${cte}
        SELECT p.id as value, p.name as label, COUNT(*) as count
        FROM matched m INNER JOIN catalog.publishers p ON p.id = m.publisher_id
        WHERE m.relevance > ${MIN_RELEVANCE}
        GROUP BY p.id, p.name ORDER BY count DESC LIMIT 20
      `.execute(this.db),
      sql<{ value: string; label: string; count: string }>`
        ${cte}
        SELECT t.id as value, t.name as label, COUNT(DISTINCT m.id) as count
        FROM matched m
        INNER JOIN catalog.work_themes wt ON wt.work_id = m.work_id
        INNER JOIN catalog.themes t ON t.id = wt.theme_id
        WHERE m.relevance > ${MIN_RELEVANCE}
        GROUP BY t.id, t.name ORDER BY count DESC LIMIT 20
      `.execute(this.db),
      sql<{ value: string; label: string; count: string }>`
        ${cte}
        SELECT g.id as value, g.name as label, COUNT(DISTINCT m.id) as count
        FROM matched m
        INNER JOIN catalog.work_genres wg ON wg.work_id = m.work_id
        INNER JOIN catalog.genres g ON g.id = wg.genre_id
        WHERE m.relevance > ${MIN_RELEVANCE}
        GROUP BY g.id, g.name ORDER BY count DESC LIMIT 20
      `.execute(this.db),
      sql<{ value: string; label: string; count: string }>`
        ${cte}
        SELECT m.language as value, m.language as label, COUNT(*) as count
        FROM matched m
        WHERE m.relevance > ${MIN_RELEVANCE}
        GROUP BY m.language ORDER BY count DESC
      `.execute(this.db),
      sql<{ value: string; label: string; count: string }>`
        ${cte}
        SELECT inv.availability as value, inv.availability as label, COUNT(*) as count
        FROM matched m INNER JOIN catalog.inventory inv ON inv.book_id = m.id
        WHERE m.relevance > ${MIN_RELEVANCE}
        GROUP BY inv.availability ORDER BY count DESC
      `.execute(this.db),
    ]);

    const toFacet = (key: string, label: string, rows: { value: string; label: string; count: string }[]): Facet => ({
      key,
      label,
      values: rows.map((r) => ({ value: r.value, label: r.label, count: Number(r.count) })),
    });

    return [
      toFacet("publisherId", "Publisher", publishers.rows),
      toFacet("themeId", "Theme", themes.rows),
      toFacet("genreId", "Genre", genres.rows),
      toFacet("language", "Language", languages.rows),
      toFacet("availability", "Availability", availability.rows),
    ];
  }

  private async personalizationSignals(anonymousId: string): Promise<PersonalizationSignals> {
    const result = await sql<{ authorId: string | null; themeId: string | null; publisherId: string }>`
      SELECT wa.author_id as "authorId", wt.theme_id as "themeId", b.publisher_id as "publisherId"
      FROM discovery.interest_events ie
      INNER JOIN catalog.books b ON b.id = ie.book_id
      LEFT JOIN catalog.work_authors wa ON wa.work_id = b.work_id
      LEFT JOIN catalog.work_themes wt ON wt.work_id = b.work_id
      WHERE ie.anonymous_id = ${anonymousId} AND ie.action = 'like'
    `.execute(this.db);

    const authorIds = new Set<string>();
    const themeIds = new Set<string>();
    const publisherIds = new Set<string>();
    for (const row of result.rows) {
      if (row.authorId) authorIds.add(row.authorId);
      if (row.themeId) themeIds.add(row.themeId);
      publisherIds.add(row.publisherId);
    }
    return { authorIds: [...authorIds], themeIds: [...themeIds], publisherIds: [...publisherIds] };
  }
}

// SPEC-08 §8 — trim, lowercase (English portion only — Tamil has no
// case), normalize Unicode, collapse duplicate spaces, normalize
// punctuation. Full language-aware normalization (Tamil-specific
// Unicode normalization forms, punctuation conventions) is out of
// scope here — this covers what's cheap and broadly correct for both
// scripts without a Tamil-specific NLP dependency.
export function normalizeQuery(raw: string): string {
  return raw
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}
