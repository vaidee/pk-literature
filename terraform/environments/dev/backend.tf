# Values here must match terraform/bootstrap's outputs exactly
# (state_bucket_name, state_lock_table_name) — bootstrap creates this
# backend, this file just points at it. See terraform/bootstrap/README.md.

terraform {
  backend "s3" {
    bucket         = "pk-literature-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "ap-southeast-1"
    dynamodb_table = "pk-literature-terraform-locks"
    encrypt        = true
  }
}
