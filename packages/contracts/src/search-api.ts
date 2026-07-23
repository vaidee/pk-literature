// Request/response shapes for the Search & Discovery API (SPEC-08,
// SPEC-16). See apps/api-search. Public, unauthenticated — SPEC-16's
// "Discovery reads" are public, and search has no writes at all
// (SPEC-08 §3 Non Goals).

import type { AutocompleteResult, BookCard, BrowseEntry, SearchResult } from "@pk-literature/domain-types";
import type { PaginationQuery } from "./pagination";

// GET /search
export interface SearchQuery extends PaginationQuery {
  q: string;
  publisherId?: string;
  authorId?: string;
  themeId?: string;
  genreId?: string;
  language?: string;
  availability?: string;
}
export type SearchResponse = SearchResult;

// GET /autocomplete
export interface AutocompleteQuery {
  q: string;
}
export interface AutocompleteResponse {
  results: AutocompleteResult[];
}

// GET /browse/{publishers,authors,themes,collections}
export type BrowseQuery = PaginationQuery;
export interface BrowseResponse {
  items: BrowseEntry[];
}

// GET /books/{id}/similar
export interface SimilarBooksResponse {
  items: BookCard[];
}
