import { Inject, Injectable } from "@nestjs/common";
import type { Kysely } from "kysely";
import type {
  Genre,
  LiteraryMovement,
  Theme,
  Work,
  WorkAuthorEntry,
  WorkSummary,
} from "@pk-literature/domain-types";
import { KYSELY } from "../database/database.module";
import type { Database } from "../database/database.types";
import { NotFoundProblem } from "../common/problem-details.exception";
import type { PaginationDto } from "../common/pagination.dto";

@Injectable()
export class WorksService {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  // Batch-fetched per list of work IDs (not N+1 per work) — the list
  // endpoints page over works.id first, then fetch each relation
  // in one extra query keyed by IN (...workIds).
  private async authorsByWork(workIds: string[]): Promise<Map<string, WorkAuthorEntry[]>> {
    if (workIds.length === 0) return new Map();
    const rows = await this.db
      .selectFrom("catalog.workAuthors")
      .innerJoin("catalog.authors", "catalog.authors.id", "catalog.workAuthors.authorId")
      .select([
        "catalog.workAuthors.workId",
        "catalog.workAuthors.role",
        "catalog.authors.id as authorId",
        "catalog.authors.canonicalName",
      ])
      .where("catalog.workAuthors.workId", "in", workIds)
      .orderBy("catalog.workAuthors.sortOrder")
      .execute();

    const map = new Map<string, WorkAuthorEntry[]>();
    for (const row of rows) {
      const entry: WorkAuthorEntry = {
        author: { id: row.authorId, canonicalName: row.canonicalName },
        role: row.role as WorkAuthorEntry["role"],
      };
      const existing = map.get(row.workId);
      if (existing) existing.push(entry);
      else map.set(row.workId, [entry]);
    }
    return map;
  }

  private async themesByWork(workIds: string[]): Promise<Map<string, Theme[]>> {
    if (workIds.length === 0) return new Map();
    const rows = await this.db
      .selectFrom("catalog.workThemes")
      .innerJoin("catalog.themes", "catalog.themes.id", "catalog.workThemes.themeId")
      .select(["catalog.workThemes.workId", "catalog.themes.id", "catalog.themes.name", "catalog.themes.slug", "catalog.themes.description"])
      .where("catalog.workThemes.workId", "in", workIds)
      .execute();

    const map = new Map<string, Theme[]>();
    for (const row of rows) {
      const theme: Theme = { id: row.id, name: row.name, slug: row.slug, description: row.description };
      const existing = map.get(row.workId);
      if (existing) existing.push(theme);
      else map.set(row.workId, [theme]);
    }
    return map;
  }

  private async genresByWork(workIds: string[]): Promise<Map<string, Genre[]>> {
    if (workIds.length === 0) return new Map();
    const rows = await this.db
      .selectFrom("catalog.workGenres")
      .innerJoin("catalog.genres", "catalog.genres.id", "catalog.workGenres.genreId")
      .select(["catalog.workGenres.workId", "catalog.genres.id", "catalog.genres.name", "catalog.genres.slug", "catalog.genres.description"])
      .where("catalog.workGenres.workId", "in", workIds)
      .execute();

    const map = new Map<string, Genre[]>();
    for (const row of rows) {
      const genre: Genre = { id: row.id, name: row.name, slug: row.slug, description: row.description };
      const existing = map.get(row.workId);
      if (existing) existing.push(genre);
      else map.set(row.workId, [genre]);
    }
    return map;
  }

  private async movementsByWork(workIds: string[]): Promise<Map<string, LiteraryMovement[]>> {
    if (workIds.length === 0) return new Map();
    const rows = await this.db
      .selectFrom("catalog.workLiteraryMovements")
      .innerJoin(
        "catalog.literaryMovements",
        "catalog.literaryMovements.id",
        "catalog.workLiteraryMovements.literaryMovementId",
      )
      .select([
        "catalog.workLiteraryMovements.workId",
        "catalog.literaryMovements.id",
        "catalog.literaryMovements.name",
        "catalog.literaryMovements.slug",
        "catalog.literaryMovements.description",
        "catalog.literaryMovements.periodStartYear",
        "catalog.literaryMovements.periodEndYear",
      ])
      .where("catalog.workLiteraryMovements.workId", "in", workIds)
      .execute();

    const map = new Map<string, LiteraryMovement[]>();
    for (const row of rows) {
      const movement: LiteraryMovement = {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        periodStartYear: row.periodStartYear,
        periodEndYear: row.periodEndYear,
      };
      const existing = map.get(row.workId);
      if (existing) existing.push(movement);
      else map.set(row.workId, [movement]);
    }
    return map;
  }

  // Used by BooksService to embed a WorkSummary in each Book without a
  // separate round trip per book — same app, so direct injection across
  // modules is fine (coding-guidelines.md's import-boundary rule is
  // about cross-service, not cross-module-within-a-service).
  async summariesByIds(workIds: string[]): Promise<Map<string, WorkSummary>> {
    if (workIds.length === 0) return new Map();
    const [rows, authorsMap] = await Promise.all([
      this.db
        .selectFrom("catalog.works")
        .select(["id", "canonicalTitle", "originalLanguage"])
        .where("id", "in", workIds)
        .execute(),
      this.authorsByWork(workIds),
    ]);

    const map = new Map<string, WorkSummary>();
    for (const row of rows) {
      map.set(row.id, {
        id: row.id,
        canonicalTitle: row.canonicalTitle,
        originalLanguage: row.originalLanguage,
        authors: authorsMap.get(row.id) ?? [],
      });
    }
    return map;
  }

  async list(pagination: PaginationDto): Promise<{ items: WorkSummary[]; totalItems: number }> {
    const [rows, countRow] = await Promise.all([
      this.db
        .selectFrom("catalog.works")
        .select(["id", "canonicalTitle", "originalLanguage"])
        .where("status", "=", "published")
        .orderBy("canonicalTitle")
        .limit(pagination.pageSize)
        .offset(pagination.offset)
        .execute(),
      this.db
        .selectFrom("catalog.works")
        .select((eb) => eb.fn.countAll<string>().as("count"))
        .where("status", "=", "published")
        .executeTakeFirstOrThrow(),
    ]);

    const workIds = rows.map((r) => r.id);
    const authorsMap = await this.authorsByWork(workIds);

    const items: WorkSummary[] = rows.map((row) => ({
      id: row.id,
      canonicalTitle: row.canonicalTitle,
      originalLanguage: row.originalLanguage,
      authors: authorsMap.get(row.id) ?? [],
    }));

    return { items, totalItems: Number(countRow.count) };
  }

  async getById(id: string): Promise<Work> {
    const row = await this.db
      .selectFrom("catalog.works")
      .selectAll()
      .where("id", "=", id)
      .where("status", "=", "published")
      .executeTakeFirst();

    if (!row) throw new NotFoundProblem("Work", id);

    const [authorsMap, themesMap, genresMap, movementsMap] = await Promise.all([
      this.authorsByWork([id]),
      this.themesByWork([id]),
      this.genresByWork([id]),
      this.movementsByWork([id]),
    ]);

    return {
      id: row.id,
      canonicalTitle: row.canonicalTitle,
      canonicalTitleTranslit: row.canonicalTitleTranslit,
      originalLanguage: row.originalLanguage,
      workType: row.workType,
      firstPublicationYear: row.firstPublicationYear,
      summary: row.summary,
      status: row.status,
      authors: authorsMap.get(id) ?? [],
      themes: themesMap.get(id) ?? [],
      genres: genresMap.get(id) ?? [],
      literaryMovements: movementsMap.get(id) ?? [],
    };
  }
}
