import { Inject, Injectable, Logger } from "@nestjs/common";
import type { Kysely } from "kysely";
import { KYSELY } from "../database/database.module";
import type { Database } from "../database/database.types";

// Consumes SPEC-07's UserRegisteredEvent (see
// ../eventbridge-handler.ts, the Lambda entry point EventBridge
// actually invokes) to fulfil SPEC-07's "Anonymous Merge: ... Cart"
// requirement — the one merge this repo implements for real; likes/
// interest-profile merging (owned by apps/api-feed's `discovery`
// schema) is a disclosed follow-up, not built here (see this repo's
// PR description / apps/medusa/README.md for the precedent of
// disclosing a deliberately out-of-scope merge target this same way).
@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async mergeAnonymousCart(userId: string, email: string, anonymousId: string | null): Promise<void> {
    // commerce.customers.id is deliberately set to the *same* uuid as
    // identity.users.id (not left to its own gen_random_uuid()
    // default) — this is what lets this schema stay a read/write
    // owner of its own `customers` table (SPEC-06 "Owns: ...
    // Customers") while still being trivially joinable back to the
    // real identity record apps/api-identity owns, with no separate
    // mapping table.
    await this.db
      .insertInto("commerce.customers")
      .values({ id: userId, email })
      .onConflict((oc) => oc.column("id").doUpdateSet({ email }))
      .execute();

    if (!anonymousId) {
      this.logger.log(`UserRegistered for ${userId} had no anonymousId — nothing to merge`);
      return;
    }

    // A customer row for this userId cannot have had an existing
    // active cart before the insert above (a cart's customer_id FK
    // requires the customer row to already exist) — so this can never
    // collide with idx_cart_one_active_per_customer. Idempotent by
    // construction too: a redelivered event finds anonymous_id already
    // cleared by the first delivery, so this UPDATE matches zero rows
    // the second time (SPEC-07 "Do not duplicate events").
    const result = await this.db
      .updateTable("commerce.cart")
      .set({ customerId: userId, anonymousId: null })
      .where("anonymousId", "=", anonymousId)
      .where("status", "=", "active")
      .executeTakeFirst();

    this.logger.log(
      `UserRegistered merge for ${userId}: ${result.numUpdatedRows} active cart(s) reassigned from anonymous_id=${anonymousId}`,
    );
  }
}
