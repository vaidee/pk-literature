import { z } from "zod";
import { InventoryAvailabilitySchema } from "./enums";

// Mirrors catalog.inventory — deliberately a separate 1:1 table from
// Book (see SPEC-15) so the publisher-adapter sync path structurally
// cannot touch editorial metadata. This is the public/read shape; it
// omits sku/updated_by/last_sync_time, which are operational detail,
// not something the storefront needs.
export const InventorySchema = z.object({
  stock: z.number().int().min(0),
  price: z.number().min(0),
  currency: z.string().length(3),
  availability: InventoryAvailabilitySchema,
});
export type Inventory = z.infer<typeof InventorySchema>;
