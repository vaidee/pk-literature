resource "aws_db_subnet_group" "this" {
  name       = "pk-literature-${var.environment}"
  subnet_ids = var.private_isolated_subnet_ids

  tags = {
    Name        = "pk-literature-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_db_parameter_group" "this" {
  name   = "pk-literature-${var.environment}"
  family = "postgres16"

  # pg_trgm is created by catalog.sql (CREATE EXTENSION IF NOT EXISTS)
  # at migration time, not here — RDS Postgres allows extension creation
  # by the master user without a parameter-group allowlist change for
  # pg_trgm/pgcrypto specifically.

  tags = {
    Environment = var.environment
  }
}

resource "aws_db_instance" "this" {
  identifier     = "pk-literature-${var.environment}"
  engine         = "postgres"
  engine_version = "16"

  instance_class    = var.instance_class
  allocated_storage = var.allocated_storage_gb
  storage_type      = "gp3"
  storage_encrypted = true # AWS-managed KMS key by default — infrastructure/secrets.md

  db_name  = "pk_literature"
  username = var.master_username
  password = var.master_password

  db_subnet_group_name   = aws_db_subnet_group.this.name
  parameter_group_name   = aws_db_parameter_group.this.name
  vpc_security_group_ids = [var.rds_sg_id]
  publicly_accessible    = false

  multi_az                  = var.multi_az
  deletion_protection       = var.deletion_protection
  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "pk-literature-${var.environment}-final-${formatdate("YYYYMMDD-hhmmss", timestamp())}"

  backup_retention_period = var.backup_retention_days
  backup_window           = "17:00-18:00" # 22:30-23:30 IST, low-traffic window
  maintenance_window      = "sun:18:00-sun:19:00"

  # IAM database authentication — app services connect via RDS Proxy
  # using IAM auth, not the master password, for the highest-traffic
  # path (infrastructure/secrets.md). The master password above exists
  # only for Terraform/migration-runner bootstrap.
  iam_database_authentication_enabled = true

  tags = {
    Name        = "pk-literature-${var.environment}"
    Environment = var.environment
  }

  lifecycle {
    ignore_changes = [final_snapshot_identifier]
  }
}
