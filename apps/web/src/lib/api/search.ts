import type {
  AutocompleteResponse,
  BrowseResponse,
  SearchQuery,
  SearchResponse,
  SimilarBooksResponse,
} from "@pk-literature/contracts";
import type { Fetcher } from "./fetcher";
import { toQueryString } from "./fetcher";

export function search(fetcher: Fetcher, query: SearchQuery): Promise<SearchResponse> {
  return fetcher(`/v1/search${toQueryString({ ...query })}`);
}

export function autocomplete(fetcher: Fetcher, q: string): Promise<AutocompleteResponse> {
  return fetcher(`/v1/autocomplete${toQueryString({ q })}`);
}

export function similarBooks(fetcher: Fetcher, bookId: string): Promise<SimilarBooksResponse> {
  return fetcher(`/v1/books/${bookId}/similar`);
}

export type BrowseEntity = "publishers" | "authors" | "themes" | "collections";

export function browse(fetcher: Fetcher, entity: BrowseEntity, page = 1, pageSize = 20): Promise<BrowseResponse> {
  return fetcher(`/v1/browse/${entity}${toQueryString({ page, pageSize })}`);
}
