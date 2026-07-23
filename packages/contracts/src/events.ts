// Hand-written TS types mirroring plan/contracts/events/*.schema.json.
// Kept in sync manually for now — codegen from the JSON Schema files is
// a reasonable future improvement, not needed for Phase 1's scope.

export interface BookPublishedEvent {
  eventId: string;
  bookId: string;
  workId: string;
  isWorksFirstPublishedBook?: boolean;
  publishedAt: string; // ISO 8601
}

export interface ImportStartedEvent {
  runId: string;
  publisherId: string;
  trigger: "scheduled" | "manual" | "retry";
}

export interface ImportCompletedEvent {
  runId: string;
  publisherId: string;
  status: "completed" | "failed" | "partially_failed";
  totalBooks: number;
  newBooks: number;
  updatedBooks: number;
  rejectedBooks: number;
}

export interface InventoryUpdatedEvent {
  bookId: string;
  stock: number;
  price: number;
}

// Publisher-import per-row events (SPEC-04 §22) — one per staging row,
// as distinct from the per-run ImportCompletedEvent above.
export interface BookImportedEvent {
  stagingBookId: string;
  importRunId: string;
  publisherId: string;
  sourceRef: string;
}

export interface ImportRejectedEvent {
  stagingBookId: string;
  importRunId: string;
  publisherId: string;
  sourceRef: string;
  reasons: string[];
}

// Commerce events (SPEC-06). customerId is nullable throughout — SPEC-06
// Principles: "Anonymous checkout supported," so an order may never
// have an authenticated customer behind it at all.
export interface OrderCreatedEvent {
  orderId: string;
  customerId: string | null;
  total: number;
}

export interface OrderPaidEvent {
  orderId: string;
  paymentId: string;
}

export interface OrderCancelledEvent {
  orderId: string;
  reason: string | null;
}

export interface OrderShippedEvent {
  orderId: string;
  shipmentId: string;
  carrier: string | null;
  trackingNumber: string | null;
}

export interface RefundIssuedEvent {
  orderId: string;
  refundId: string;
  amount: number;
}

// Identity events (SPEC-07). Published by apps/api-identity on
// registration; anonymousId is null when the caller registered without
// ever having sent an X-Anonymous-Id (a session that starts as a
// direct signup, not a browse-then-register flow) — consumers (e.g.
// apps/api-commerce's cart-merge handler) treat that as "nothing to
// merge," not an error. "Do not duplicate events" (SPEC-07 Anonymous
// Merge) is enforced by identity.anonymous_profiles.merged_at, not by
// this event type itself.
export interface UserRegisteredEvent {
  userId: string;
  email: string;
  anonymousId: string | null;
}
