import { z } from "zod";
import { BookCardSchema } from "./feed";

// SPEC-08 §16 "Search Response" / §15 "Faceted Search". Facet `key`
// matches the query param clients would send back to filter by it
// (e.g. `publisherId`, `themeId`, `language`, `availability`) — not
// every facet dimension SPEC-08 lists is implemented yet (Price and
// Publication Year are range-shaped, not the same
// count-per-discrete-value shape as the others; see apps/api-search's
// search.service.ts for what's actually wired up).
export const FacetValueSchema = z.object({
  value: z.string(),
  label: z.string(),
  count: z.number().int().nonnegative(),
});
export type FacetValue = z.infer<typeof FacetValueSchema>;

export const FacetSchema = z.object({
  key: z.string(),
  label: z.string(),
  values: z.array(FacetValueSchema),
});
export type Facet = z.infer<typeof FacetSchema>;

export const SearchResultSchema = z.object({
  items: z.array(BookCardSchema),
  facets: z.array(FacetSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;

// SPEC-08 §14 "Autocomplete" — spans multiple entity types in one
// ranked list, so each result carries its own `type` rather than being
// grouped into five separate arrays.
export const AutocompleteResultTypeSchema = z.enum(["book", "author", "publisher", "theme", "collection"]);
export type AutocompleteResultType = z.infer<typeof AutocompleteResultTypeSchema>;

export const AutocompleteResultSchema = z.object({
  type: AutocompleteResultTypeSchema,
  id: z.string().uuid(),
  label: z.string(),
  sublabel: z.string().nullable(),
});
export type AutocompleteResult = z.infer<typeof AutocompleteResultSchema>;

// SPEC-08 §18 "Browse Experience" — an entity plus how many published
// books it's connected to, which is what makes /browse/* meaningfully
// different from apps/api-catalog's plain GET /authors etc. (SPEC-16).
// `slug` is nullable: catalog.authors has no slug column at all
// (only themes/genres/collections do; publishers use `code` in its
// place) — rather than inventing one that doesn't exist in the DB.
export const BrowseEntrySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string().nullable(),
  bookCount: z.number().int().nonnegative(),
});
export type BrowseEntry = z.infer<typeof BrowseEntrySchema>;
