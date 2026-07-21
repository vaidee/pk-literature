import { z } from "zod";
import { MediaAssetTypeSchema } from "./enums";

// Mirrors catalog.media_assets. Publicly, only what's needed to render
// an <img> — s3_key is resolved to a CloudFront URL by the API layer,
// never exposed as a raw S3 key to clients.
export const MediaAssetSchema = z.object({
  id: z.string().uuid(),
  assetType: MediaAssetTypeSchema,
  url: z.string().url(),
  widthPx: z.number().int().positive().nullable(),
  heightPx: z.number().int().positive().nullable(),
});
export type MediaAsset = z.infer<typeof MediaAssetSchema>;
