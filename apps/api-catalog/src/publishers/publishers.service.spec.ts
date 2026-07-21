import type { Kysely } from "kysely";
import { createFluentDbMock } from "../../test/kysely-mock";
import { NotFoundProblem } from "../common/problem-details.exception";
import { PublishersService } from "./publishers.service";
import type { Database } from "../database/database.types";

describe("PublishersService", () => {
  describe("list", () => {
    it("returns items and totalItems from the two parallel queries", async () => {
      const db = createFluentDbMock({
        executeResult: [{ id: "1", name: "Kalachuvadu", code: "kalachuvadu" }],
        executeTakeFirstOrThrowResult: { count: "1" },
      });
      const service = new PublishersService(db as unknown as Kysely<Database>);

      const result = await service.list({ page: 1, pageSize: 20, offset: 0 } as never);

      expect(result.items).toHaveLength(1);
      expect(result.totalItems).toBe(1);
    });
  });

  describe("getById", () => {
    it("throws NotFoundProblem when no row matches", async () => {
      const db = createFluentDbMock({ executeTakeFirstResult: undefined });
      const service = new PublishersService(db as unknown as Kysely<Database>);

      await expect(service.getById("missing-id")).rejects.toThrow(NotFoundProblem);
    });

    it("resolves the logo via toMediaAsset when present", async () => {
      const db = createFluentDbMock({
        executeTakeFirstResult: {
          id: "1",
          name: "Kalachuvadu",
          code: "kalachuvadu",
          website: null,
          country: null,
          logoId: "logo-1",
          logoAssetType: "publisher_logo",
          logoS3Key: "logos/kalachuvadu.png",
          logoWidthPx: 200,
          logoHeightPx: 200,
        },
      });
      const service = new PublishersService(db as unknown as Kysely<Database>);

      const result = await service.getById("1");

      expect(result.logo).not.toBeNull();
      expect(result.logo?.url).toContain("logos/kalachuvadu.png");
    });
  });
});
