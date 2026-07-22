import { z } from "zod";

// Mirrors catalog.editorial_status exactly (plan/database/ddl/catalog.sql).
// Shared by Work, Book, and Collection lifecycles — see
// plan/state-machines/book.md for the transition rules and the
// DB-enforced invariant between Work.status and Book.status.
export const EditorialStatusSchema = z.enum([
  "draft",
  "needs_review",
  "approved",
  "published",
  "archived",
]);
export type EditorialStatus = z.infer<typeof EditorialStatusSchema>;

// Mirrors catalog.work_type.
export const WorkTypeSchema = z.enum([
  "novel",
  "short_story_collection",
  "poetry_collection",
  "essay_collection",
  "drama",
  "biography",
  "non_fiction",
  "other",
]);
export type WorkType = z.infer<typeof WorkTypeSchema>;

// Mirrors catalog.book_format.
export const BookFormatSchema = z.enum(["paperback", "hardcover"]);
export type BookFormat = z.infer<typeof BookFormatSchema>;

// Mirrors catalog.inventory_availability.
export const InventoryAvailabilitySchema = z.enum([
  "in_stock",
  "out_of_stock",
  "preorder",
  "discontinued",
]);
export type InventoryAvailability = z.infer<typeof InventoryAvailabilitySchema>;

// Mirrors catalog.publisher_adapter_type.
export const PublisherAdapterTypeSchema = z.enum([
  "manual",
  "html",
  "rest",
  "graphql",
  "csv",
  "json_feed",
]);
export type PublisherAdapterType = z.infer<typeof PublisherAdapterTypeSchema>;

// Mirrors catalog.media_asset_type.
export const MediaAssetTypeSchema = z.enum([
  "cover",
  "publisher_logo",
  "banner",
  "author_photo",
]);
export type MediaAssetType = z.infer<typeof MediaAssetTypeSchema>;
