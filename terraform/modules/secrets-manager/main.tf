# Phase 0 scope: the RDS master credential only. This secret exists
# purely for Terraform/migration-runner bootstrap — app services use RDS
# Proxy IAM database authentication, never this stored password (see
# infrastructure/secrets.md). Every other secret (Razorpay, Directus,
# Medusa, ...) is created by the phase that actually needs it.

resource "random_password" "rds_master" {
  length  = 32
  special = true
  # RDS disallows /, @, ", and space in the password itself.
  override_special = "!#$%^&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "rds_master" {
  name        = "/pk-literature/${var.environment}/rds/master"
  description = "RDS PostgreSQL master credential — Terraform/migration bootstrap only, not used by app services (they use RDS Proxy IAM auth)"

  tags = {
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "rds_master" {
  secret_id = aws_secretsmanager_secret.rds_master.id
  secret_string = jsonencode({
    username = var.rds_master_username
    password = random_password.rds_master.result
  })
}
