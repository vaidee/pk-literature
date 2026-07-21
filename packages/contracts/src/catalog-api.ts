// Request/response shapes for the Catalog API (SPEC-02, SPEC-16). This
// API is read-only end to end — no request bodies, only query params
// and path params. See apps/api-catalog.

import type {
  Work,
  WorkSummary,
  Book,
  BookListItem,
  Author,
  AuthorSummary,
  Publisher,
  PublisherSummary,
  Collection,
  Theme,
  Genre,
} from "@pk-literature/domain-types";
import type { PaginatedResponse, PaginationQuery } from "./pagination";

// GET /works
export type ListWorksQuery = PaginationQuery;
export type ListWorksResponse = PaginatedResponse<WorkSummary>;

// GET /works/{id}
export type GetWorkResponse = Work;

// GET /books
export interface ListBooksQuery extends PaginationQuery {
  /** Filter to books belonging to this work (other editions/translations). */
  workId?: string;
  publisherId?: string;
}
export type ListBooksResponse = PaginatedResponse<BookListItem>;

// GET /books/{id}
export type GetBookResponse = Book;

// GET /authors
export type ListAuthorsQuery = PaginationQuery;
export type ListAuthorsResponse = PaginatedResponse<AuthorSummary>;

// GET /authors/{id}
export type GetAuthorResponse = Author;

// GET /publishers
export type ListPublishersQuery = PaginationQuery;
export type ListPublishersResponse = PaginatedResponse<PublisherSummary>;

// GET /publishers/{id}
export type GetPublisherResponse = Publisher;

// GET /collections
export type ListCollectionsResponse = PaginatedResponse<Collection>;

// GET /themes
export type ListThemesResponse = PaginatedResponse<Theme>;

// GET /genres
export type ListGenresResponse = PaginatedResponse<Genre>;
