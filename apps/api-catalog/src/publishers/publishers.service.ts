import { Inject, Injectable } from "@nestjs/common";
import type { Kysely } from "kysely";
import type { Publisher, PublisherSummary } from "@pk-literature/domain-types";
import { KYSELY } from "../database/database.module";
import type { Database } from "../database/database.types";
import { toMediaAsset } from "../common/media-url";
import { NotFoundProblem } from "../common/problem-details.exception";
import type { PaginationDto } from "../common/pagination.dto";

@Injectable()
export class PublishersService {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async list(pagination: PaginationDto): Promise<{ items: PublisherSummary[]; totalItems: number }> {
    const [items, countRow] = await Promise.all([
      this.db
        .selectFrom("catalog.publishers")
        .select(["id", "name", "code"])
        .where("active", "=", true)
        .orderBy("name")
        .limit(pagination.pageSize)
        .offset(pagination.offset)
        .execute(),
      this.db
        .selectFrom("catalog.publishers")
        .select((eb) => eb.fn.countAll<string>().as("count"))
        .where("active", "=", true)
        .executeTakeFirstOrThrow(),
    ]);

    return { items, totalItems: Number(countRow.count) };
  }

  async getById(id: string): Promise<Publisher> {
    const row = await this.db
      .selectFrom("catalog.publishers")
      .leftJoin("catalog.mediaAssets", "catalog.mediaAssets.id", "catalog.publishers.logoAssetId")
      .select([
        "catalog.publishers.id",
        "catalog.publishers.name",
        "catalog.publishers.code",
        "catalog.publishers.website",
        "catalog.publishers.country",
        "catalog.mediaAssets.id as logoId",
        "catalog.mediaAssets.assetType as logoAssetType",
        "catalog.mediaAssets.s3Key as logoS3Key",
        "catalog.mediaAssets.widthPx as logoWidthPx",
        "catalog.mediaAssets.heightPx as logoHeightPx",
      ])
      .where("catalog.publishers.id", "=", id)
      .where("catalog.publishers.active", "=", true)
      .executeTakeFirst();

    if (!row) throw new NotFoundProblem("Publisher", id);

    return {
      id: row.id,
      name: row.name,
      code: row.code,
      website: row.website,
      country: row.country,
      logo: toMediaAsset(
        row.logoId
          ? {
              id: row.logoId,
              assetType: row.logoAssetType!,
              s3Key: row.logoS3Key!,
              widthPx: row.logoWidthPx,
              heightPx: row.logoHeightPx,
            }
          : null,
      ),
    };
  }
}
