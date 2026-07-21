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

// Commerce events (SPEC-06) — defined here now since the schema JSON
// already exists, even though apps/api-commerce itself is Phase 6.
export interface OrderCreatedEvent {
  orderId: string;
  customerId: string;
  total: number;
}

export interface OrderPaidEvent {
  orderId: string;
  paymentId: string;
}
