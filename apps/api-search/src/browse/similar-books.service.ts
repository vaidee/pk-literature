import { Inject, Injectable } from "@nestjs/common";
import { sql, type Kysely } from "kysely";
import type { BookCard } from "@pk-literature/domain-types";
import { KYSELY } from "../database/database.module";
import type { Database } from "../database/database.types";
import { BookCardBuilder } from "../common/book-card-builder";
import { NotFoundProblem } from "../common/problem-details.exception";

const MAX_SIMILAR = 10;

// SPEC-08 §17 "Similar Books" signals: shared author, shared theme,
// shared publisher, shared genre (Knowledge Graph / Embedding
// Similarity are explicitly "Future"). Ranked by how many of those
// four a candidate shares with the source book, adapted from
// apps/api-feed's personalized-similar shelf query (same shape, a
// single source book's signals instead of a liked-books set). No jest
// unit test — same raw-SQL-can't-be-meaningfully-mocked reasoning as
// search.service.ts. Validated for real against local Postgres: a
// book sharing the source's author and theme outranked one sharing
// only its publisher; the source book itself and other editions of
// the same work were both correctly excluded (an edition of the same
// work is a different printing, not a "similar" book).
@Injectable()
export class SimilarBooksService {
  constructor(
    @Inject(KYSELY) private readonly db: Kysely<Database>,
    private readonly cardBuilder: BookCardBuilder,
  ) {}

  async similarTo(bookId: string): Promise<BookCard[]> {
    const source = await this.db
      .selectFrom("catalog.books")
      .select(["workId", "publisherId"])
      .where("id", "=", bookId)
      .where("status", "=", "published")
      .executeTakeFirst();
    if (!source) throw new NotFoundProblem("Book", bookId);

    const result = await sql<{ id: string; matchScore: string }>`
      SELECT b.id,
        (CASE WHEN b.publisher_id = ${source.publisherId} THEN 1 ELSE 0 END) +
        (SELECT COUNT(*) FROM catalog.work_authors wa
         WHERE wa.work_id = b.work_id AND wa.author_id IN (
           SELECT author_id FROM catalog.work_authors WHERE work_id = ${source.workId}
         )) +
        (SELECT COUNT(*) FROM catalog.work_themes wt
         WHERE wt.work_id = b.work_id AND wt.theme_id IN (
           SELECT theme_id FROM catalog.work_themes WHERE work_id = ${source.workId}
         )) +
        (SELECT COUNT(*) FROM catalog.work_genres wg
         WHERE wg.work_id = b.work_id AND wg.genre_id IN (
           SELECT genre_id FROM catalog.work_genres WHERE work_id = ${source.workId}
         )) AS "matchScore"
      FROM catalog.books b
      WHERE b.status = 'published' AND b.id != ${bookId} AND b.work_id != ${source.workId}
      ORDER BY "matchScore" DESC, b.id
      LIMIT ${MAX_SIMILAR * 3}
    `.execute(this.db);

    const ranked = result.rows.filter((r) => Number(r.matchScore) > 0);
    const ids = ranked.slice(0, MAX_SIMILAR).map((r) => r.id);
    return this.cardBuilder.build(ids);
  }
}
