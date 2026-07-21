import { Inject, Injectable } from "@nestjs/common";
import type { Kysely } from "kysely";
import type { Author, AuthorSummary } from "@pk-literature/domain-types";
import { KYSELY } from "../database/database.module";
import type { Database } from "../database/database.types";
import { toMediaAsset } from "../common/media-url";
import { NotFoundProblem } from "../common/problem-details.exception";
import type { PaginationDto } from "../common/pagination.dto";

@Injectable()
export class AuthorsService {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async list(pagination: PaginationDto): Promise<{ items: AuthorSummary[]; totalItems: number }> {
    const [items, countRow] = await Promise.all([
      this.db
        .selectFrom("catalog.authors")
        .select(["id", "canonicalName"])
        .orderBy("canonicalName")
        .limit(pagination.pageSize)
        .offset(pagination.offset)
        .execute(),
      this.db
        .selectFrom("catalog.authors")
        .select((eb) => eb.fn.countAll<string>().as("count"))
        .executeTakeFirstOrThrow(),
    ]);

    return { items, totalItems: Number(countRow.count) };
  }

  async getById(id: string): Promise<Author> {
    const row = await this.db
      .selectFrom("catalog.authors")
      .leftJoin("catalog.mediaAssets", "catalog.mediaAssets.id", "catalog.authors.photoAssetId")
      .select([
        "catalog.authors.id",
        "catalog.authors.canonicalName",
        "catalog.authors.nativeName",
        "catalog.authors.biography",
        "catalog.authors.birthYear",
        "catalog.authors.deathYear",
        "catalog.mediaAssets.id as photoId",
        "catalog.mediaAssets.assetType as photoAssetType",
        "catalog.mediaAssets.s3Key as photoS3Key",
        "catalog.mediaAssets.widthPx as photoWidthPx",
        "catalog.mediaAssets.heightPx as photoHeightPx",
      ])
      .where("catalog.authors.id", "=", id)
      .executeTakeFirst();

    if (!row) throw new NotFoundProblem("Author", id);

    return {
      id: row.id,
      canonicalName: row.canonicalName,
      nativeName: row.nativeName,
      biography: row.biography,
      birthYear: row.birthYear,
      deathYear: row.deathYear,
      photo: toMediaAsset(
        row.photoId
          ? {
              id: row.photoId,
              assetType: row.photoAssetType!,
              s3Key: row.photoS3Key!,
              widthPx: row.photoWidthPx,
              heightPx: row.photoHeightPx,
            }
          : null,
      ),
    };
  }
}
