import { Inject, Injectable } from "@nestjs/common";
import { sql, type Kysely } from "kysely";
import type { AutocompleteResult, AutocompleteResultType } from "@pk-literature/domain-types";
import { KYSELY } from "../database/database.module";
import type { Database } from "../database/database.types";

// SPEC-08 §14: triggered after 2 characters, max 10 results, spans
// Books/Authors/Publishers/Themes/Collections in one ranked list.
const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 10;

// No jest unit test — same reasoning as search.service.ts: the
// interesting behavior is in the raw SQL (prefix-match-beats-fuzzy-
// match ordering across a UNION of 5 different tables), which a mock
// can't exercise. Validated for real against local Postgres: a 2-char
// prefix query correctly ranked an exact-prefix book title above a
// same-similarity-score author match; a query below 2 characters
// correctly returned no results without erroring.
@Injectable()
export class AutocompleteService {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async search(rawQuery: string): Promise<AutocompleteResult[]> {
    const q = rawQuery.trim();
    if (q.length < MIN_QUERY_LENGTH) return [];

    const result = await sql<{
      type: AutocompleteResultType;
      id: string;
      label: string;
      sublabel: string | null;
      score: number;
    }>`
      (SELECT 'book' as type, b.id, b.title as label, p.name as sublabel,
        CASE WHEN b.title ILIKE ${q + "%"} THEN 1.0 ELSE similarity(b.title, ${q}) END as score
       FROM catalog.books b
       INNER JOIN catalog.publishers p ON p.id = b.publisher_id
       WHERE b.status = 'published' AND (b.title ILIKE ${"%" + q + "%"} OR b.title % ${q})
       ORDER BY score DESC LIMIT ${MAX_RESULTS})
      UNION ALL
      (SELECT 'author' as type, a.id, a.canonical_name as label, NULL as sublabel,
        CASE WHEN a.canonical_name ILIKE ${q + "%"} THEN 1.0 ELSE similarity(a.canonical_name, ${q}) END as score
       FROM catalog.authors a
       WHERE a.canonical_name ILIKE ${"%" + q + "%"} OR a.canonical_name % ${q}
       ORDER BY score DESC LIMIT ${MAX_RESULTS})
      UNION ALL
      (SELECT 'publisher' as type, p.id, p.name as label, NULL as sublabel,
        CASE WHEN p.name ILIKE ${q + "%"} THEN 1.0 ELSE similarity(p.name, ${q}) END as score
       FROM catalog.publishers p
       WHERE p.name ILIKE ${"%" + q + "%"} OR p.name % ${q}
       ORDER BY score DESC LIMIT ${MAX_RESULTS})
      UNION ALL
      (SELECT 'theme' as type, t.id, t.name as label, NULL as sublabel,
        CASE WHEN t.name ILIKE ${q + "%"} THEN 1.0 ELSE similarity(t.name, ${q}) END as score
       FROM catalog.themes t
       WHERE t.name ILIKE ${"%" + q + "%"} OR t.name % ${q}
       ORDER BY score DESC LIMIT ${MAX_RESULTS})
      UNION ALL
      (SELECT 'collection' as type, c.id, c.name as label, NULL as sublabel,
        CASE WHEN c.name ILIKE ${q + "%"} THEN 1.0 ELSE similarity(c.name, ${q}) END as score
       FROM catalog.collections c
       WHERE c.status = 'published' AND (c.name ILIKE ${"%" + q + "%"} OR c.name % ${q})
       ORDER BY score DESC LIMIT ${MAX_RESULTS})
      ORDER BY score DESC
      LIMIT ${MAX_RESULTS}
    `.execute(this.db);

    return result.rows.map((row) => ({
      type: row.type,
      id: row.id,
      label: row.label,
      sublabel: row.sublabel,
    }));
  }
}
