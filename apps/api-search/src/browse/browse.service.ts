import { Inject, Injectable } from "@nestjs/common";
import type { Kysely } from "kysely";
import type { BrowseEntry } from "@pk-literature/domain-types";
import { KYSELY } from "../database/database.module";
import type { Database } from "../database/database.types";
import type { PaginationDto } from "../common/pagination.dto";

@Injectable()
export class BrowseService {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async publishers(pagination: PaginationDto): Promise<BrowseEntry[]> {
    const rows = await this.db
      .selectFrom("catalog.publishers")
      .leftJoin("catalog.books", (join) =>
        join.onRef("catalog.books.publisherId", "=", "catalog.publishers.id").on("catalog.books.status", "=", "published"),
      )
      .select(["catalog.publishers.id", "catalog.publishers.name", "catalog.publishers.code"])
      .select((eb) => eb.fn.count<string>("catalog.books.id").as("bookCount"))
      .groupBy(["catalog.publishers.id", "catalog.publishers.name", "catalog.publishers.code"])
      .orderBy("catalog.publishers.name")
      .limit(pagination.pageSize)
      .offset(pagination.offset)
      .execute();

    return rows.map((r) => ({ id: r.id, name: r.name, slug: r.code, bookCount: Number(r.bookCount) }));
  }

  async authors(pagination: PaginationDto): Promise<BrowseEntry[]> {
    const rows = await this.db
      .selectFrom("catalog.authors")
      .leftJoin("catalog.workAuthors", "catalog.workAuthors.authorId", "catalog.authors.id")
      .leftJoin("catalog.books", (join) =>
        join.onRef("catalog.books.workId", "=", "catalog.workAuthors.workId").on("catalog.books.status", "=", "published"),
      )
      .select(["catalog.authors.id", "catalog.authors.canonicalName"])
      .select((eb) => eb.fn.count<string>("catalog.books.id").distinct().as("bookCount"))
      .groupBy(["catalog.authors.id", "catalog.authors.canonicalName"])
      .orderBy("catalog.authors.canonicalName")
      .limit(pagination.pageSize)
      .offset(pagination.offset)
      .execute();

    return rows.map((r) => ({ id: r.id, name: r.canonicalName, slug: null, bookCount: Number(r.bookCount) }));
  }

  async themes(pagination: PaginationDto): Promise<BrowseEntry[]> {
    const rows = await this.db
      .selectFrom("catalog.themes")
      .leftJoin("catalog.workThemes", "catalog.workThemes.themeId", "catalog.themes.id")
      .leftJoin("catalog.books", (join) =>
        join.onRef("catalog.books.workId", "=", "catalog.workThemes.workId").on("catalog.books.status", "=", "published"),
      )
      .select(["catalog.themes.id", "catalog.themes.name", "catalog.themes.slug"])
      .select((eb) => eb.fn.count<string>("catalog.books.id").distinct().as("bookCount"))
      .groupBy(["catalog.themes.id", "catalog.themes.name", "catalog.themes.slug"])
      .orderBy("catalog.themes.name")
      .limit(pagination.pageSize)
      .offset(pagination.offset)
      .execute();

    return rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug, bookCount: Number(r.bookCount) }));
  }

  async collections(pagination: PaginationDto): Promise<BrowseEntry[]> {
    const rows = await this.db
      .selectFrom("catalog.collections")
      .leftJoin("catalog.bookCollections", "catalog.bookCollections.collectionId", "catalog.collections.id")
      .select(["catalog.collections.id", "catalog.collections.name", "catalog.collections.slug"])
      .select((eb) => eb.fn.count<string>("catalog.bookCollections.bookId").as("bookCount"))
      .where("catalog.collections.status", "=", "published")
      .groupBy(["catalog.collections.id", "catalog.collections.name", "catalog.collections.slug"])
      .orderBy("catalog.collections.name")
      .limit(pagination.pageSize)
      .offset(pagination.offset)
      .execute();

    return rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug, bookCount: Number(r.bookCount) }));
  }
}
