import { Inject, Injectable } from "@nestjs/common";
import type { Kysely } from "kysely";
import type { Collection } from "@pk-literature/domain-types";
import { KYSELY } from "../database/database.module";
import type { Database } from "../database/database.types";
import type { PaginationDto } from "../common/pagination.dto";

@Injectable()
export class CollectionsService {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  // Only Published collections are returned — SPEC-02 acceptance
  // criteria: "APIs expose only Published books" applies symmetrically
  // to every editorially-gated entity this service serves.
  async list(pagination: PaginationDto): Promise<{ items: Collection[]; totalItems: number }> {
    const [items, countRow] = await Promise.all([
      this.db
        .selectFrom("catalog.collections")
        .selectAll()
        .where("status", "=", "published")
        .orderBy("name")
        .limit(pagination.pageSize)
        .offset(pagination.offset)
        .execute(),
      this.db
        .selectFrom("catalog.collections")
        .select((eb) => eb.fn.countAll<string>().as("count"))
        .where("status", "=", "published")
        .executeTakeFirstOrThrow(),
    ]);

    return { items, totalItems: Number(countRow.count) };
  }
}
