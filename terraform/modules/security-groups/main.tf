# Phase 0 added the DB-access chain + VPC endpoint access. Phase 2 adds
# ecs-directus-sg and alb-admin-sg below. Phase 6 adds lambda-egress-sg
# and ecs-medusa-sg, per development/branching.md's "each phase owns
# its own infra" rule.
#
# Chain: rds-sg <- rds-proxy-sg <- lambda-db-sg
# (infrastructure/networking.md)

resource "aws_security_group" "rds" {
  name_prefix = "pk-literature-${var.environment}-rds-"
  vpc_id      = var.vpc_id
  description = "RDS PostgreSQL - inbound only from RDS Proxy"

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
  description = "RDS Proxy - inbound only from Lambda/ECS needing DB access"

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
  description = "Attached to private-nat-tier Lambdas (Commerce) needing internet egress - outbound 443 only"

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
  description = "Interface VPC endpoints (Secrets Manager, EventBridge, CloudWatch Logs) - inbound 443 from the private-isolated tier"

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

# ---------------------------------------------------------------------
# Phase 2: Directus admin ALB + ECS task. Directus sits in the
# private-isolated tier (ADR-009 — nothing in its runtime needs the
# internet; image pulls happen at deploy time via VPC endpoints /
# ECR, not runtime egress), fronted by a public-subnet ALB.
# ---------------------------------------------------------------------

resource "aws_security_group" "alb_admin" {
  name_prefix = "pk-literature-${var.environment}-alb-admin-"
  vpc_id      = var.vpc_id
  description = "Admin ALB (Directus, Medusa) - public HTTPS ingress only"

  tags = {
    Name        = "pk-literature-${var.environment}-alb-admin"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "ecs_directus" {
  name_prefix = "pk-literature-${var.environment}-ecs-directus-"
  vpc_id      = var.vpc_id
  description = "Directus ECS task - inbound only from the admin ALB"

  tags = {
    Name        = "pk-literature-${var.environment}-ecs-directus"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "alb_admin_from_internet" {
  security_group_id = aws_security_group.alb_admin.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
  description       = "HTTPS from the internet - editorial users only reach this via Directus's own auth"
}

resource "aws_vpc_security_group_egress_rule" "alb_admin_to_ecs_directus" {
  security_group_id            = aws_security_group.alb_admin.id
  referenced_security_group_id = aws_security_group.ecs_directus.id
  from_port                    = 8055
  to_port                      = 8055
  ip_protocol                  = "tcp"
  description                  = "Directus container port"
}

resource "aws_vpc_security_group_ingress_rule" "ecs_directus_from_alb" {
  security_group_id            = aws_security_group.ecs_directus.id
  referenced_security_group_id = aws_security_group.alb_admin.id
  from_port                    = 8055
  to_port                      = 8055
  ip_protocol                  = "tcp"
  description                  = "Directus container port from the admin ALB"
}

resource "aws_vpc_security_group_egress_rule" "ecs_directus_to_rds_proxy" {
  security_group_id            = aws_security_group.ecs_directus.id
  referenced_security_group_id = aws_security_group.rds_proxy.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  description                  = "Postgres to RDS Proxy"
}

resource "aws_vpc_security_group_egress_rule" "ecs_directus_to_vpc_endpoints" {
  security_group_id            = aws_security_group.ecs_directus.id
  referenced_security_group_id = aws_security_group.vpc_endpoints.id
  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"
  description                  = "HTTPS to S3/Secrets Manager/EventBridge/ECR interface endpoints"
}

# ---------------------------------------------------------------------
# Phase 6: Medusa ECS task. Unlike ecs-directus (private-isolated, no
# internet route), this one lives in the private-nat tier — it's the
# other half of ADR-009's "NAT Gateway tier: shrinks to {commerce,
# Medusa}" (alongside lambda-api-commerce), needing real internet
# egress to reach Razorpay for refunds (SPEC-06's "Medusa
# Responsibilities: Refunds"). Egress rules mirror lambda-egress-sg
# rather than ecs-directus-sg's vpc-endpoints-sg egress — the NAT
# Gateway route handles Secrets Manager/EventBridge/ECR reachability
# for anything already routed to the internet, so no separate
# vpc-endpoints-sg egress is needed here (same reasoning as
# lambda-egress-sg, which has no vpc-endpoints-sg rule either).
# ---------------------------------------------------------------------

resource "aws_security_group" "ecs_medusa" {
  name_prefix = "pk-literature-${var.environment}-ecs-medusa-"
  vpc_id      = var.vpc_id
  description = "Medusa ECS task - inbound from the admin ALB, outbound internet egress for Razorpay"

  tags = {
    Name        = "pk-literature-${var.environment}-ecs-medusa"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_egress_rule" "alb_admin_to_ecs_medusa" {
  security_group_id            = aws_security_group.alb_admin.id
  referenced_security_group_id = aws_security_group.ecs_medusa.id
  from_port                    = 9000
  to_port                      = 9000
  ip_protocol                  = "tcp"
  description                  = "Medusa container port"
}

resource "aws_vpc_security_group_ingress_rule" "ecs_medusa_from_alb" {
  security_group_id            = aws_security_group.ecs_medusa.id
  referenced_security_group_id = aws_security_group.alb_admin.id
  from_port                    = 9000
  to_port                      = 9000
  ip_protocol                  = "tcp"
  description                  = "Medusa container port from the admin ALB"
}

resource "aws_vpc_security_group_egress_rule" "ecs_medusa_to_rds_proxy" {
  security_group_id            = aws_security_group.ecs_medusa.id
  referenced_security_group_id = aws_security_group.rds_proxy.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  description                  = "Postgres to RDS Proxy"
}

resource "aws_vpc_security_group_egress_rule" "ecs_medusa_to_internet" {
  security_group_id = aws_security_group.ecs_medusa.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
  description       = "HTTPS egress (Razorpay, Secrets Manager, EventBridge, ECR) via NAT Gateway"
}
