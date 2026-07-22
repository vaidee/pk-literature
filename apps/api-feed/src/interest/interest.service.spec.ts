import type { Kysely } from "kysely";
import { ValidationProblem } from "../common/problem-details.exception";
import { InterestService } from "./interest.service";
import type { Database } from "../database/database.types";

describe("InterestService", () => {
  describe("setLike", () => {
    it("throws ValidationProblem when no anonymous id is provided", async () => {
      // Never reaches the db — this is the one branch of setLike that
      // doesn't need real Postgres, unlike the insert/onConflict path
      // (see feed.service.ts's disclosure comment for why that path is
      // validated manually instead of mocked).
      const service = new InterestService({} as unknown as Kysely<Database>);

      await expect(service.setLike(undefined, "11111111-1111-1111-1111-111111111111", true)).rejects.toThrow(
        ValidationProblem,
      );
    });
  });
});
