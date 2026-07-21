# Phase 0 scope only: the DB-access chain + VPC endpoint access.
# ecs-directus-sg, ecs-medusa-sg, and alb-admin-sg are added by
# phase-2-editorial-workbench and phase-6-commerce respectively, per
# development/branching.md's "each phase owns its own infra" rule —
# they don't exist yet because those services don't exist yet.
#
# Chain: rds-sg <- rds-proxy-sg <- lambda-db-sg
# (infrastructure/networking.md)

resource "aws_security_group" "rds" {
  name_prefix = "pk-literature-${var.environment}-rds-"
  vpc_id      = var.vpc_id
  description = "RDS PostgreSQL — inbound only from RDS Proxy"

  tags = {
    Name        = "pk-literature-${var.environment}-rds"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "rds_proxy" {
  name_prefix = "pk-literature-${var.environment}-rds-proxy-"
  vpc_id      = var.vpc_id
  description = "RDS Proxy — inbound only from Lambda/ECS needing DB access"

  tags = {
    Name        = "pk-literature-${var.environment}-rds-proxy"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "lambda_db" {
  name_prefix = "pk-literature-${var.environment}-lambda-db-"
  vpc_id      = var.vpc_id
  description = "Attached to every Lambda/ECS task needing DB access, regardless of subnet tier"

  tags = {
    Name        = "pk-literature-${var.environment}-lambda-db"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "lambda_egress" {
  name_prefix = "pk-literature-${var.environment}-lambda-egress-"
  vpc_id      = var.vpc_id
  description = "Attached to private-nat-tier Lambdas (Commerce) needing internet egress — outbound 443 only"

  tags = {
    Name        = "pk-literature-${var.environment}-lambda-egress"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "pk-literature-${var.environment}-vpc-endpoints-"
  vpc_id      = var.vpc_id
  description = "Interface VPC endpoints (Secrets Manager, EventBridge, CloudWatch Logs) — inbound 443 from the private-isolated tier"

  tags = {
    Name        = "pk-literature-${var.environment}-vpc-endpoints"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

# --- rds-sg: ingress 5432 from rds-proxy-sg only ---

resource "aws_vpc_security_group_ingress_rule" "rds_from_proxy" {
  security_group_id            = aws_security_group.rds.id
  referenced_security_group_id = aws_security_group.rds_proxy.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  description                  = "Postgres from RDS Proxy"
}

# --- rds-proxy-sg: ingress 5432 from lambda-db-sg; egress 5432 to rds-sg ---

resource "aws_vpc_security_group_ingress_rule" "rds_proxy_from_lambda_db" {
  security_group_id            = aws_security_group.rds_proxy.id
  referenced_security_group_id = aws_security_group.lambda_db.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  description                  = "Postgres from Lambda/ECS DB clients"
}

resource "aws_vpc_security_group_egress_rule" "rds_proxy_to_rds" {
  security_group_id            = aws_security_group.rds_proxy.id
  referenced_security_group_id = aws_security_group.rds.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  description                  = "Postgres to RDS"
}

# --- lambda-db-sg: egress 5432 to rds-proxy-sg, egress 443 to vpc-endpoints-sg ---

resource "aws_vpc_security_group_egress_rule" "lambda_db_to_rds_proxy" {
  security_group_id            = aws_security_group.lambda_db.id
  referenced_security_group_id = aws_security_group.rds_proxy.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  description                  = "Postgres to RDS Proxy"
}

resource "aws_vpc_security_group_egress_rule" "lambda_db_to_vpc_endpoints" {
  security_group_id            = aws_security_group.lambda_db.id
  referenced_security_group_id = aws_security_group.vpc_endpoints.id
  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"
  description                  = "HTTPS to Secrets Manager/EventBridge/CloudWatch Logs interface endpoints"
}

# --- lambda-egress-sg: egress 443 to the internet (via NAT), egress 5432 to rds-proxy-sg ---

resource "aws_vpc_security_group_egress_rule" "lambda_egress_to_internet" {
  security_group_id = aws_security_group.lambda_egress.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
  description       = "HTTPS egress (Razorpay) via NAT Gateway"
}

resource "aws_vpc_security_group_egress_rule" "lambda_egress_to_rds_proxy" {
  security_group_id            = aws_security_group.lambda_egress.id
  referenced_security_group_id = aws_security_group.rds_proxy.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  description                  = "Postgres to RDS Proxy (Commerce Lambda needs both DB and Razorpay)"
}

# --- vpc-endpoints-sg: ingress 443 from lambda-db-sg ---

resource "aws_vpc_security_group_ingress_rule" "vpc_endpoints_from_lambda_db" {
  security_group_id            = aws_security_group.vpc_endpoints.id
  referenced_security_group_id = aws_security_group.lambda_db.id
  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"
  description                  = "HTTPS from private-isolated-tier Lambda/ECS clients"
}
