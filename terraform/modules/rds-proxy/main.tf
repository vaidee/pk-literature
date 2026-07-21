# RDS Proxy connection pooling — fronts the single RDS instance so
# Lambda's high connection churn doesn't exhaust Postgres's own
# connection limit. Clients authenticate with IAM tokens
# (require_iam_auth), not the stored master password — that password is
# only used by the proxy itself to open its pooled backend connections.

data "aws_iam_policy_document" "rds_proxy_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["rds.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "rds_proxy" {
  name               = "pk-literature-${var.environment}-rds-proxy"
  assume_role_policy = data.aws_iam_policy_document.rds_proxy_assume_role.json
}

data "aws_iam_policy_document" "rds_proxy_secrets" {
  statement {
    effect    = "Allow"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [var.rds_master_secret_arn]
  }
}

resource "aws_iam_role_policy" "rds_proxy_secrets" {
  name   = "secrets-access"
  role   = aws_iam_role.rds_proxy.id
  policy = data.aws_iam_policy_document.rds_proxy_secrets.json
}

resource "aws_db_proxy" "this" {
  name                   = "pk-literature-${var.environment}"
  engine_family          = "POSTGRESQL"
  role_arn               = aws_iam_role.rds_proxy.arn
  vpc_subnet_ids         = var.private_isolated_subnet_ids
  vpc_security_group_ids = [var.rds_proxy_sg_id]
  require_tls            = true

  auth {
    auth_scheme = "SECRETS"
    iam_auth    = var.require_iam_auth ? "REQUIRED" : "DISABLED"
    secret_arn  = var.rds_master_secret_arn
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_db_proxy_default_target_group" "this" {
  db_proxy_name = aws_db_proxy.this.name

  connection_pool_config {
    max_connections_percent      = 90
    max_idle_connections_percent = 50
    connection_borrow_timeout    = 120
  }
}

resource "aws_db_proxy_target" "this" {
  db_proxy_name          = aws_db_proxy.this.name
  target_group_name      = aws_db_proxy_default_target_group.this.name
  db_instance_identifier = var.db_instance_id
}
