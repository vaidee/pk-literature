import { Inject, Injectable } from "@nestjs/common";
import type { Kysely } from "kysely";
import { KYSELY } from "../database/database.module";
import type { Database } from "../database/database.types";
import { NotFoundProblem, ValidationProblem } from "../common/problem-details.exception";

// Postgres error code for a foreign-key violation — thrown here when
// bookId doesn't reference a real catalog.books row (discovery.sql's
// interest_events.book_id FK).
const FOREIGN_KEY_VIOLATION = "23503";

@Injectable()
export class InterestService {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async setLike(anonymousId: string | undefined, bookId: string, liked: boolean): Promise<{ bookId: string; liked: boolean }> {
    if (!anonymousId) {
      // SPEC-05: likes require an anonymous profile to attach to —
      // unlike GET /feed, there's no meaningful anonymous-first
      // fallback for a write that's entirely about *this* profile's
      // interests.
      throw new ValidationProblem("X-Anonymous-Id header is required to record a like.");
    }

    await this.db
      .insertInto("discovery.interestProfiles")
      .values({ anonymousId })
      .onConflict((oc) => oc.column("anonymousId").doNothing())
      .execute();

    try {
      await this.db
        .insertInto("discovery.interestEvents")
        .values({ anonymousId, bookId, action: liked ? "like" : "unlike" })
        .execute();
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new NotFoundProblem("Book", bookId);
      }
      throw error;
    }

    return { bookId, liked };
  }
}

function isForeignKeyViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === FOREIGN_KEY_VIOLATION;
}
