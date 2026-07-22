import { z } from "zod";
import { EditorialStatusSchema } from "./enums";

// Mirrors catalog.collections — editorial shelves (Editor's Picks, New
// Arrivals, ...). Attached to Books, not Works — see SPEC-15's
// rationale (a shelf is about a specific purchasable printing becoming
// available, not the abstract work).
export const CollectionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable(),
  status: EditorialStatusSchema,
});
export type Collection = z.infer<typeof CollectionSchema>;

export const CollectionSummarySchema = CollectionSchema.pick({
  id: true,
  name: true,
  slug: true,
});
export type CollectionSummary = z.infer<typeof CollectionSummarySchema>;
