import { Inject, Injectable } from "@nestjs/common";
import type { Kysely } from "kysely";
import type { BookCard } from "@pk-literature/domain-types";
import { KYSELY } from "../database/database.module";
import type { Database } from "../database/database.types";
import { toMediaAsset } from "../common/media-url";

// A book counts as "new" for the chip (SPEC-05's "New" chip) within
// this many days of its publication_date — arbitrary but reasonable;
// there's no spec'd value, and this is cheap to tune later without a
// schema change since it's evaluated at read time, not stored.
const NEW_WINDOW_DAYS = 90;

@Injectable()
export class BookCardBuilder {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  /**
   * Batch-builds BookCards for a list of book ids, preserving the
   * input order (the caller has already decided ranking — this only
   * hydrates display data, one query per joined concern rather than
   * N+1 per book).
   */
  async build(bookIds: string[]): Promise<BookCard[]> {
    if (bookIds.length === 0) return [];

    const [books, primaryAuthors, primaryThemes] = await Promise.all([
      this.db
        .selectFrom("catalog.books")
        .innerJoin("catalog.publishers", "catalog.publishers.id", "catalog.books.publisherId")
        .leftJoin("catalog.mediaAssets", "catalog.mediaAssets.id", "catalog.books.coverAssetId")
        .leftJoin("catalog.inventory", "catalog.inventory.bookId", "catalog.books.id")
        .select([
          "catalog.books.id",
          "catalog.books.workId",
          "catalog.books.title",
          "catalog.books.publicationDate",
          "catalog.publishers.name as publisherName",
          "catalog.mediaAssets.id as coverId",
          "catalog.mediaAssets.assetType as coverAssetType",
          "catalog.mediaAssets.s3Key as coverS3Key",
          "catalog.mediaAssets.widthPx as coverWidthPx",
          "catalog.mediaAssets.heightPx as coverHeightPx",
          "catalog.inventory.price",
          "catalog.inventory.currency",
        ])
        .where("catalog.books.id", "in", bookIds)
        .execute(),
      this.primaryAuthorsByWork(bookIds),
      this.primaryThemesByWork(bookIds),
    ]);

    const byId = new Map(books.map((b) => [b.id, b]));
    const now = Date.now();

    return bookIds
      .map((id) => byId.get(id))
      .filter((row): row is NonNullable<typeof row> => row !== undefined)
      .map((row) => {
        const isNew = row.publicationDate
          ? now - new Date(row.publicationDate).getTime() < NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000
          : false;

        return {
          id: row.id,
          title: row.title,
          authorName: primaryAuthors.get(row.workId) ?? null,
          publisherName: row.publisherName,
          cover: toMediaAsset(
            row.coverId
              ? {
                  id: row.coverId,
                  assetType: row.coverAssetType!,
                  s3Key: row.coverS3Key!,
                  widthPx: row.coverWidthPx,
                  heightPx: row.coverHeightPx,
                }
              : null,
          ),
          price: row.price !== null ? Number(row.price) : null,
          currency: row.currency,
          chips: { theme: primaryThemes.get(row.workId) ?? null, isNew },
        };
      });
  }

  private async primaryAuthorsByWork(bookIds: string[]): Promise<Map<string, string>> {
    const rows = await this.db
      .selectFrom("catalog.books")
      .innerJoin("catalog.workAuthors", "catalog.workAuthors.workId", "catalog.books.workId")
      .innerJoin("catalog.authors", "catalog.authors.id", "catalog.workAuthors.authorId")
      .select(["catalog.books.workId", "catalog.authors.canonicalName"])
      .where("catalog.books.id", "in", bookIds)
      .orderBy("catalog.workAuthors.sortOrder")
      .execute();

    const map = new Map<string, string>();
    for (const row of rows) {
      if (!map.has(row.workId)) map.set(row.workId, row.canonicalName);
    }
    return map;
  }

  private async primaryThemesByWork(bookIds: string[]): Promise<Map<string, string>> {
    const rows = await this.db
      .selectFrom("catalog.books")
      .innerJoin("catalog.workThemes", "catalog.workThemes.workId", "catalog.books.workId")
      .innerJoin("catalog.themes", "catalog.themes.id", "catalog.workThemes.themeId")
      .select(["catalog.books.workId", "catalog.themes.name"])
      .where("catalog.books.id", "in", bookIds)
      .execute();

    const map = new Map<string, string>();
    for (const row of rows) {
      if (!map.has(row.workId)) map.set(row.workId, row.name);
    }
    return map;
  }
}
