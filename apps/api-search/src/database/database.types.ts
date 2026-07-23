import type { ColumnType, Generated } from "kysely";
import type { MediaAssetType } from "@pk-literature/domain-types";

// Hand-written against plan/database/ddl/catalog.sql (read-only) plus
// the one discovery table this service reads for personalization
// (discovery.interest_events — SPEC-08 §21). Same CamelCasePlugin
// convention as every other service. Only the columns this service's
// search/autocomplete/browse/similar queries actually need are typed
// here, not full mirrors of apps/api-catalog's own database.types.ts.

export interface CatalogBookTable {
  id: string;
  workId: string;
  publisherId: string;
  isbn13: string | null;
  title: string;
  subtitle: string | null;
  language: string;
  coverAssetId: string | null;
  status: string;
  publicationDate: ColumnType<string, never, never> | null;
  createdAt: ColumnType<Date, never, never>;
}

export interface CatalogWorkTable {
  id: string;
  canonicalTitle: string;
  originalLanguage: string;
  workType: string;
  status: string;
}

export interface CatalogAuthorTable {
  id: string;
  canonicalName: string;
  biography: string | null;
}

export interface CatalogPublisherTable {
  id: string;
  name: string;
  code: string;
}

export interface CatalogThemeTable {
  id: string;
  name: string;
  slug: string;
}

export interface CatalogGenreTable {
  id: string;
  name: string;
  slug: string;
}

export interface CatalogCollectionTable {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export interface CatalogMediaAssetTable {
  id: string;
  assetType: MediaAssetType;
  s3Key: string;
  widthPx: number | null;
  heightPx: number | null;
}

export interface CatalogInventoryTable {
  bookId: string;
  stock: number;
  price: string;
  currency: string;
  availability: string;
}

export interface CatalogWorkAuthorTable {
  workId: string;
  authorId: string;
  role: string;
  sortOrder: number;
}

export interface CatalogWorkThemeTable {
  workId: string;
  themeId: string;
}

export interface CatalogWorkGenreTable {
  workId: string;
  genreId: string;
}

export interface CatalogBookCollectionTable {
  bookId: string;
  collectionId: string;
  sortOrder: number;
}

export interface InterestEventTable {
  id: string;
  anonymousId: string;
  bookId: string;
  action: string;
  createdAt: Generated<ColumnType<Date, never, never>>;
}

export interface Database {
  "catalog.books": CatalogBookTable;
  "catalog.works": CatalogWorkTable;
  "catalog.authors": CatalogAuthorTable;
  "catalog.publishers": CatalogPublisherTable;
  "catalog.themes": CatalogThemeTable;
  "catalog.genres": CatalogGenreTable;
  "catalog.collections": CatalogCollectionTable;
  "catalog.mediaAssets": CatalogMediaAssetTable;
  "catalog.inventory": CatalogInventoryTable;
  "catalog.workAuthors": CatalogWorkAuthorTable;
  "catalog.workThemes": CatalogWorkThemeTable;
  "catalog.workGenres": CatalogWorkGenreTable;
  "catalog.bookCollections": CatalogBookCollectionTable;
  "discovery.interestEvents": InterestEventTable;
}
