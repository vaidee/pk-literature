import { Injectable } from "@nestjs/common";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";

const client = new S3Client({});

export interface StoredCover {
  s3Key: string;
  checksumSha256: string;
}

@Injectable()
export class MediaStorageService {
  private readonly bucket = process.env.MEDIA_BUCKET_NAME;

  // SPEC-04 §13's cover pipeline is Download -> Virus Scan -> Optimize
  // -> Thumbnail -> Upload S3 -> Store Metadata. This only implements
  // Download (done by the adapter/crawler, not here) and Upload —
  // Virus Scan/Optimize/Thumbnail are not wired up in this phase (no
  // scanning service, no image-processing pipeline exists yet in this
  // repo). Stored under a `staging/` prefix, distinct from the
  // `covers/`-style keys catalog.media_assets uses once promoted, so a
  // rejected staging book's never-reviewed cover is never reachable via
  // the same key an approved book would use.
  async storeStagingCover(stagingBookId: string, contentType: string, bytes: Buffer): Promise<StoredCover> {
    if (!this.bucket) {
      throw new Error("MEDIA_BUCKET_NAME is not set");
    }

    const checksumSha256 = createHash("sha256").update(bytes).digest("hex");
    const s3Key = `staging/${stagingBookId}/cover-original`;

    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
        Body: bytes,
        ContentType: contentType,
      }),
    );

    return { s3Key, checksumSha256 };
  }
}
