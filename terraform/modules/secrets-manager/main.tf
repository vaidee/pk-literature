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

# ---------------------------------------------------------------------
# Phase 2: Directus. Unlike every other service's DB credential, this
# one is a genuinely stored password injected via ECS task-definition
# secrets — Directus's Knex-based Postgres client has no dynamic IAM
# token refresh support the way apps/api-catalog's Kysely setup does
# (see infrastructure/secrets.md's stored-password exception). KEY and
# SECRET are Directus's own required encryption/signing values (its
# docs: KEY seeds internal project identification, SECRET signs
# auth/session tokens) — both are opaque random values we generate
# once and never need to read back ourselves.
# ---------------------------------------------------------------------

resource "random_password" "directus_db" {
  length  = 32
  special = false # plain env-var-injected password — avoid shell/JSON-escaping surprises
}

resource "aws_secretsmanager_secret" "directus_db" {
  name        = "/pk-literature/${var.environment}/directus/db-password"
  description = "Stored password for the directus_app DB role (migration 20260101000006) — Directus can't do RDS Proxy IAM auth"

  tags = {
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "directus_db" {
  secret_id     = aws_secretsmanager_secret.directus_db.id
  secret_string = random_password.directus_db.result
}

resource "random_password" "directus_key" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "directus_key" {
  name        = "/pk-literature/${var.environment}/directus/key"
  description = "Directus KEY — project identification value required at boot"

  tags = {
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "directus_key" {
  secret_id     = aws_secretsmanager_secret.directus_key.id
  secret_string = random_password.directus_key.result
}

resource "random_password" "directus_secret" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "directus_secret" {
  name        = "/pk-literature/${var.environment}/directus/secret"
  description = "Directus SECRET — signs auth/session tokens"

  tags = {
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "directus_secret" {
  secret_id     = aws_secretsmanager_secret.directus_secret.id
  secret_string = random_password.directus_secret.result
}

resource "random_password" "directus_admin" {
  length           = 32
  special          = true
  override_special = "!#$%^&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "directus_admin" {
  name        = "/pk-literature/${var.environment}/directus/admin-password"
  description = "Directus first-boot admin user password (ADMIN_EMAIL/ADMIN_PASSWORD env vars)"

  tags = {
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "directus_admin" {
  secret_id     = aws_secretsmanager_secret.directus_admin.id
  secret_string = random_password.directus_admin.result
}
