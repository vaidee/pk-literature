# 3-tier VPC: public / private-isolated / private-nat.
# See plan/implementation-blueprint/infrastructure/networking.md for the
# full rationale — private-isolated has NO route to NAT or IGW at all
# (RDS, RDS Proxy, and the read-heavy Catalog/Feed/Search/Identity/
# publisher-import Lambdas, plus Directus ECS); private-nat is only for
# things with a genuine reason to reach the public internet (Commerce
# Lambda, Medusa ECS — both call Razorpay).
#
# Every resource below is gated on var.create_vpc so this module can
# also run in "reuse an existing VPC" mode (variables.tf) without
# touching any downstream module — see that variable's own comment.

data "aws_vpc" "existing" {
  count = var.create_vpc ? 0 : 1
  id    = var.existing_vpc_id
}

resource "aws_vpc" "this" {
  count = var.create_vpc ? 1 : 0

  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "pk-literature-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "this" {
  count = var.create_vpc ? 1 : 0

  vpc_id = aws_vpc.this[0].id

  tags = {
    Name        = "pk-literature-${var.environment}-igw"
    Environment = var.environment
  }
}

# --- Public subnets (NAT Gateway ENI + Directus/Medusa admin ALBs only) ---

resource "aws_subnet" "public" {
  for_each = var.create_vpc ? { for idx, az in var.azs : az => idx } : {}

  vpc_id                  = aws_vpc.this[0].id
  availability_zone       = each.key
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, each.value)
  map_public_ip_on_launch = true

  tags = {
    Name        = "pk-literature-${var.environment}-public-${each.key}"
    Environment = var.environment
    Tier        = "public"
  }
}

resource "aws_route_table" "public" {
  count = var.create_vpc ? 1 : 0

  vpc_id = aws_vpc.this[0].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this[0].id
  }

  tags = {
    Name        = "pk-literature-${var.environment}-public"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public[0].id
}

# --- NAT Gateway(s) — single by default (infrastructure/networking.md) ---

resource "aws_eip" "nat" {
  for_each = var.create_vpc ? (var.single_nat_gateway ? { (var.azs[0]) = 0 } : { for idx, az in var.azs : az => idx }) : {}

  domain = "vpc"

  tags = {
    Name        = "pk-literature-${var.environment}-nat-${each.key}"
    Environment = var.environment
  }
}

resource "aws_nat_gateway" "this" {
  for_each = aws_eip.nat

  allocation_id = each.value.id
  subnet_id     = aws_subnet.public[each.key].id

  tags = {
    Name        = "pk-literature-${var.environment}-nat-${each.key}"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.this]
}

# --- Private-isolated subnets (NO route to NAT or IGW) ---

resource "aws_subnet" "private_isolated" {
  for_each = var.create_vpc ? { for idx, az in var.azs : az => idx } : {}

  vpc_id            = aws_vpc.this[0].id
  availability_zone = each.key
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, 10 + each.value)

  tags = {
    Name        = "pk-literature-${var.environment}-private-isolated-${each.key}"
    Environment = var.environment
    Tier        = "private-isolated"
  }
}

# No NAT/IGW route — this route table only ever gets the default local
# VPC route Terraform/AWS adds implicitly. Its emptiness (no 0.0.0.0/0
# route at all) is the actual security property, not a config to tune.
resource "aws_route_table" "private_isolated" {
  count = var.create_vpc ? 1 : 0

  vpc_id = aws_vpc.this[0].id

  tags = {
    Name        = "pk-literature-${var.environment}-private-isolated"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "private_isolated" {
  for_each = aws_subnet.private_isolated

  subnet_id      = each.value.id
  route_table_id = aws_route_table.private_isolated[0].id
}

# --- Private-NAT subnets (Commerce Lambda, Medusa ECS — Razorpay calls) ---

resource "aws_subnet" "private_nat" {
  for_each = var.create_vpc ? { for idx, az in var.azs : az => idx } : {}

  vpc_id            = aws_vpc.this[0].id
  availability_zone = each.key
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, 20 + each.value)

  tags = {
    Name        = "pk-literature-${var.environment}-private-nat-${each.key}"
    Environment = var.environment
    Tier        = "private-nat"
  }
}

resource "aws_route_table" "private_nat" {
  for_each = aws_subnet.private_nat

  vpc_id = aws_vpc.this[0].id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = var.single_nat_gateway ? aws_nat_gateway.this[var.azs[0]].id : aws_nat_gateway.this[each.key].id
  }

  tags = {
    Name        = "pk-literature-${var.environment}-private-nat-${each.key}"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "private_nat" {
  for_each = aws_subnet.private_nat

  subnet_id      = each.value.id
  route_table_id = aws_route_table.private_nat[each.key].id
}
