import { Inject, Injectable } from "@nestjs/common";
import type { Kysely } from "kysely";
import type { Genre } from "@pk-literature/domain-types";
import { KYSELY } from "../database/database.module";
import type { Database } from "../database/database.types";
import type { PaginationDto } from "../common/pagination.dto";

@Injectable()
export class GenresService {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async list(pagination: PaginationDto): Promise<{ items: Genre[]; totalItems: number }> {
    const [items, countRow] = await Promise.all([
      this.db
        .selectFrom("catalog.genres")
        .selectAll()
        .orderBy("name")
        .limit(pagination.pageSize)
        .offset(pagination.offset)
        .execute(),
      this.db
        .selectFrom("catalog.genres")
        .select((eb) => eb.fn.countAll<string>().as("count"))
        .executeTakeFirstOrThrow(),
    ]);

    return { items, totalItems: Number(countRow.count) };
  }
}
