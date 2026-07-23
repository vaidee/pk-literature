import type { ColumnType } from "kysely";
import type { User } from "@pk-literature/domain-types";

export interface UserRow {
  id: string;
  email: string;
  displayName: string;
  phone: string | null;
  preferredLanguage: string;
  createdAt: Date | string | ColumnType<Date, never, never>;
}

// Kysely infers createdAt as ColumnType<Date, never, never> rather than
// unwrapping to plain Date the way it does for other
// Generated<ColumnType<...>> columns elsewhere in this repo — the
// runtime value from `pg` is a real Date either way (a TS inference
// gap, not a runtime one, first documented in
// apps/api-commerce/src/orders/orders.service.ts), so the cast is safe.
export function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    phone: row.phone,
    preferredLanguage: row.preferredLanguage,
    createdAt: (row.createdAt as unknown as Date).toISOString(),
  };
}
