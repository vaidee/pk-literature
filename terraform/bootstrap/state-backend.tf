# Remote state backend for every terraform/environments/<env>/ stack.
# Shared across all three environments — each environment points at a
# distinct object key inside this one bucket (see environments/*/backend.tf),
# not separate buckets and not Terraform workspaces.
#
# infrastructure/terraform-layout.md — "Teardown" section: this bucket
# and its contents must survive any environment's `terraform destroy`.
# It does, structurally, because it isn't declared in any environment's
# own state — but the bucket policy below adds a second, independent
# layer of protection against accidental deletion.

resource "aws_s3_bucket" "terraform_state" {
  bucket = var.state_bucket_name

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket                  = aws_s3_bucket.terraform_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Deny bucket/object deletion for everyone except the account root user
# (a deliberate break-glass path, not a role assumed day to day). This is
# a second, independent guard beyond "nothing in environments/ declares
# this bucket" — belt and suspenders for the one resource the whole
# platform's state depends on.
data "aws_caller_identity" "current" {}

resource "aws_s3_bucket_policy" "terraform_state_deletion_protection" {
  bucket = aws_s3_bucket.terraform_state.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyBucketDeletion"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:DeleteBucket"
        Resource  = aws_s3_bucket.terraform_state.arn
      },
      {
        Sid    = "DenyObjectDeletionExceptRoot"
        Effect = "Deny"
        NotPrincipal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = ["s3:DeleteObject", "s3:DeleteObjectVersion"]
        Resource = "${aws_s3_bucket.terraform_state.arn}/*"
      }
    ]
  })
}

resource "aws_dynamodb_table" "terraform_locks" {
  name         = var.state_lock_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  lifecycle {
    prevent_destroy = true
  }
}
