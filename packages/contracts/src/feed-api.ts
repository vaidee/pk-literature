// Request/response shapes for the Discovery Feed API (SPEC-05, SPEC-16).
// See apps/api-feed. Public, unauthenticated — SPEC-16's "Discovery
// reads" plus the one write (POST /interest/like), extended the same
// way since there's no anonymous-session auth yet (SPEC-07, Phase 7).

import type { FeedResponse, BookCard } from "@pk-literature/domain-types";
import type { PaginationQuery } from "./pagination";

// GET /feed
export type GetFeedResponse = FeedResponse;

// GET /feed/shelf/{id} — infinite horizontal scroll (SPEC-05), not
// classic page-N-of-M pagination: `hasMore` is the real continuation
// signal, so this isn't PaginatedResponse<BookCard> (that shape's
// totalItems/totalPages would need a second, expensive count query
// against the same ranking logic as the items query itself — not
// worth it when the client only ever needs "is there another page").
export type GetShelfQuery = PaginationQuery;
export interface GetShelfResponse {
  items: BookCard[];
  hasMore: boolean;
}

// POST /interest/like
export interface PostLikeRequest {
  bookId: string;
  /** true = like, false = reverse a previous like (SPEC-05: "Likes are reversible"). */
  liked: boolean;
}
export interface PostLikeResponse {
  bookId: string;
  liked: boolean;
}
