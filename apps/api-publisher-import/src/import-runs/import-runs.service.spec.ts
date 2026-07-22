import type { Kysely } from "kysely";
import { createFluentDbMock } from "../../test/kysely-mock";
import { NotFoundProblem } from "../common/problem-details.exception";
import { EventBridgeService } from "../common/eventbridge.service";
import { ImportRunsService } from "./import-runs.service";
import type { Database } from "../database/database.types";

function mockEvents() {
  return { publish: jest.fn().mockResolvedValue(undefined) } as unknown as EventBridgeService;
}

describe("ImportRunsService", () => {
  describe("getCursor", () => {
    it("returns the stored cursor for a known publisher", async () => {
      const db = createFluentDbMock({
        executeTakeFirstResult: { lastImportCursor: "page-5", lastImportAt: new Date("2026-01-01T00:00:00Z") },
      });
      const service = new ImportRunsService(db as unknown as Kysely<Database>, mockEvents());

      const result = await service.getCursor("publisher-1");

      expect(result).toEqual({ cursor: "page-5", lastImportAt: "2026-01-01T00:00:00.000Z" });
    });

    it("throws NotFoundProblem when the publisher does not exist", async () => {
      const db = createFluentDbMock({ executeTakeFirstResult: undefined });
      const service = new ImportRunsService(db as unknown as Kysely<Database>, mockEvents());

      await expect(service.getCursor("missing")).rejects.toThrow(NotFoundProblem);
    });
  });

  describe("start", () => {
    it("throws NotFoundProblem when the publisher does not exist", async () => {
      const db = createFluentDbMock({ executeTakeFirstResult: undefined });
      const service = new ImportRunsService(db as unknown as Kysely<Database>, mockEvents());

      await expect(service.start("missing", "manual")).rejects.toThrow(NotFoundProblem);
    });
  });
});
