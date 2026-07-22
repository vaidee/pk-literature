import { z } from "zod";
import { BookFormatSchema, EditorialStatusSchema } from "./enums";
import { MediaAssetSchema } from "./media-asset";
import { PublisherSummarySchema } from "./publisher";
import { WorkSummarySchema } from "./work";
import { BookContributorSchema } from "./author";
import { CollectionSummarySchema } from "./collection";
import { InventorySchema } from "./inventory";

// Mirrors catalog.books — a specific purchasable edition, translation,
// or printing of a Work. This is what the storefront, cart, and orders
// reference by id (SPEC-15, ADR-008).
export const BookSchema = z.object({
  id: z.string().uuid(),
  isbn13: z.string().length(13).nullable(),
  title: z.string().min(1),
  subtitle: z.string().nullable(),
  language: z.string().length(2),
  editionLabel: z.string().nullable(),
  editionNumber: z.number().int().nullable(),
  format: BookFormatSchema,
  pageCount: z.number().int().positive().nullable(),
  publicationDate: z.string().date().nullable(),
  cover: MediaAssetSchema.nullable(),
  status: EditorialStatusSchema,
  work: WorkSummarySchema,
  publisher: PublisherSummarySchema,
  contributors: z.array(BookContributorSchema),
  collections: z.array(CollectionSummarySchema),
  inventory: InventorySchema.nullable(),
  translatedFromBookId: z.string().uuid().nullable(),
});
export type Book = z.infer<typeof BookSchema>;

// Lighter shape for list/shelf views (feed cards, search results) —
// avoids shipping the full contributor/collection arrays for every card.
export const BookListItemSchema = BookSchema.pick({
  id: true,
  title: true,
  subtitle: true,
  language: true,
  format: true,
  cover: true,
  work: true,
  publisher: true,
  inventory: true,
});
export type BookListItem = z.infer<typeof BookListItemSchema>;
