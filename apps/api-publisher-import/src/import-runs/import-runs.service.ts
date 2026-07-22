import { Inject, Injectable } from "@nestjs/common";
import type { Kysely } from "kysely";
import type { ImportCompletedEvent, ImportStartedEvent } from "@pk-literature/contracts";
import { KYSELY } from "../database/database.module";
import type { Database } from "../database/database.types";
import { NotFoundProblem } from "../common/problem-details.exception";
import { EventBridgeService } from "../common/eventbridge.service";
import type { CompleteImportRunDto } from "./dto/complete-import-run.dto";

@Injectable()
export class ImportRunsService {
  constructor(
    @Inject(KYSELY) private readonly db: Kysely<Database>,
    private readonly events: EventBridgeService,
  ) {}

  async start(publisherId: string, trigger: "scheduled" | "manual" | "retry"): Promise<{ runId: string }> {
    const publisher = await this.db
      .selectFrom("catalog.publishers")
      .select("id")
      .where("id", "=", publisherId)
      .executeTakeFirst();
    if (!publisher) throw new NotFoundProblem("Publisher", publisherId);

    const run = await this.db
      .insertInto("staging.importRuns")
      .values({ publisherId, trigger, status: "running" })
      .returning("id")
      .executeTakeFirstOrThrow();

    const event: ImportStartedEvent = { runId: run.id, publisherId, trigger };
    await this.events.publish("ImportStarted", event);

    return { runId: run.id };
  }

  async complete(runId: string, dto: CompleteImportRunDto): Promise<{ runId: string; status: string }> {
    const run = await this.db
      .updateTable("staging.importRuns")
      .set({
        status: dto.status,
        completedAt: new Date(),
        errorSummary: dto.errorSummary ?? null,
      })
      .where("id", "=", runId)
      .returningAll()
      .executeTakeFirst();
    if (!run) throw new NotFoundProblem("ImportRun", runId);

    // ADR-009: the watermark only advances on a run that actually
    // completed successfully — a failed run must not silently skip the
    // window it never processed on the next scheduled run.
    if (dto.cursor && dto.status !== "failed") {
      await this.db
        .updateTable("catalog.publishers")
        .set({ lastImportCursor: dto.cursor, lastImportAt: new Date() })
        .where("id", "=", run.publisherId)
        .execute();
    }

    const event: ImportCompletedEvent = {
      runId: run.id,
      publisherId: run.publisherId,
      status: dto.status,
      totalBooks: run.totalBooks,
      newBooks: run.newBooks,
      updatedBooks: run.updatedBooks,
      rejectedBooks: run.rejectedBooks,
    };
    await this.events.publish("ImportCompleted", event);

    return { runId: run.id, status: run.status };
  }

  async getCursor(publisherId: string): Promise<{ cursor: string | null; lastImportAt: string | null }> {
    const row = await this.db
      .selectFrom("catalog.publishers")
      .select(["lastImportCursor", "lastImportAt"])
      .where("id", "=", publisherId)
      .executeTakeFirst();
    if (!row) throw new NotFoundProblem("Publisher", publisherId);

    return {
      cursor: row.lastImportCursor,
      lastImportAt: row.lastImportAt ? row.lastImportAt.toISOString() : null,
    };
  }
}
