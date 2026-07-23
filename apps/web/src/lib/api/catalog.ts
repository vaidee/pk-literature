import type { GetBookResponse } from "@pk-literature/contracts";
import type { Fetcher } from "./fetcher";

// apps/api-catalog — read-only (SPEC-02). Routed through the same
// shared API Gateway as every other service (ANY /v1/books/{proxy+}).
export function getBook(fetcher: Fetcher, bookId: string): Promise<GetBookResponse> {
  return fetcher(`/v1/books/${bookId}`);
}
