import type { Selectable } from "kysely";
import type { MediaAsset } from "@pk-literature/domain-types";
import type { MediaAssetTable } from "../database/database.types";

// Resolves a stored S3 key to a public CloudFront URL — clients never
// see a raw s3Key (infrastructure/networking.md: the media bucket has
// no public access at all, only CloudFront's Origin Access Control).
// CDN_BASE_URL matches the `cdn.<domain>` alias the cloudfront
// Terraform module creates (terraform/modules/cloudfront).
const CDN_BASE_URL = process.env.CDN_BASE_URL ?? "https://cdn.pk-literature.example";

// Selectable<T> unwraps Generated<T> columns (e.g. id) to their plain
// value type — correct for a row already fetched from a query, as
// opposed to MediaAssetTable itself, which is typed for insert/update.
export function toMediaAsset(
  row: Selectable<Pick<MediaAssetTable, "id" | "assetType" | "s3Key" | "widthPx" | "heightPx">> | null,
): MediaAsset | null {
  if (!row) return null;
  return {
    id: row.id,
    assetType: row.assetType,
    url: `${CDN_BASE_URL}/${row.s3Key}`,
    widthPx: row.widthPx,
    heightPx: row.heightPx,
  };
}
