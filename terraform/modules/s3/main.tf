# Covers, publisher logos, and other media referenced by
# catalog.media_assets.s3_key. Read via CloudFront (Origin Access
# Control — no public bucket access), written by Directus (ecs-directus
# role, added in phase-2) and the staging-ingest Lambda (added in
# phase-3). Phase 0 just creates the bucket itself.

resource "aws_s3_bucket" "media" {
  bucket        = "pk-literature-${var.environment}-media"
  force_destroy = var.force_destroy

  tags = {
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "media" {
  bucket = aws_s3_bucket.media.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "media" {
  bucket = aws_s3_bucket.media.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "media" {
  bucket                  = aws_s3_bucket.media.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Origin Access Control bucket policy is created in the cloudfront
# module, not here — it needs this bucket's ARN AND the distribution's
# own ARN in the same policy, and creating it in whichever module
# creates the distribution avoids a circular module dependency (this
# module would need the distribution ARN as input, while the cloudfront
# module needs this bucket's domain name as input — both can't be true
# at once across module boundaries).
