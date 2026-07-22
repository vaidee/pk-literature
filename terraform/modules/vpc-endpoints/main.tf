# Lets the private-isolated tier (RDS-only Lambdas + Directus) reach S3,
# Secrets Manager, EventBridge, CloudWatch Logs, and ECR without a NAT
# Gateway — infrastructure/networking.md. S3 is a free gateway endpoint;
# the rest are small flat-rate interface endpoints, cheaper than routing
# that traffic through NAT once more than a couple of low-volume
# functions are doing it. ecr.api/ecr.dkr were added in Phase 2 —
# Directus's ECS task is the first thing in the isolated tier that
# needs to pull a container image (Lambda deployment packages don't go
# through ECR at all, so nothing needed this before now).

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = var.private_isolated_route_table_ids

  tags = {
    Name        = "pk-literature-${var.environment}-s3"
    Environment = var.environment
  }
}

locals {
  interface_endpoint_services = [
    "secretsmanager",
    "events",
    "logs",
    "ecr.api",
    "ecr.dkr",
  ]
}

resource "aws_vpc_endpoint" "interface" {
  for_each = toset(local.interface_endpoint_services)

  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.aws_region}.${each.value}"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.private_isolated_subnet_ids
  security_group_ids  = [var.endpoint_security_group_id]
  private_dns_enabled = true

  tags = {
    Name        = "pk-literature-${var.environment}-${each.value}"
    Environment = var.environment
  }
}
