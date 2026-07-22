import { z } from "zod";
import { MediaAssetSchema } from "./media-asset";

// Mirrors catalog.publishers. adapter_type/last_import_cursor/
// last_import_at are internal to the import pipeline (SPEC-04, ADR-009)
// and deliberately not exposed on the public shape.
export const PublisherSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().min(1),
  website: z.string().url().nullable(),
  country: z.string().length(2).nullable(),
  logo: MediaAssetSchema.nullable(),
});
export type Publisher = z.infer<typeof PublisherSchema>;

export const PublisherSummarySchema = PublisherSchema.pick({
  id: true,
  name: true,
  code: true,
});
export type PublisherSummary = z.infer<typeof PublisherSummarySchema>;
