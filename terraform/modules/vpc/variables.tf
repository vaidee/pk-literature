variable "environment" {
  description = "Environment name (dev/qa/prod) — used in resource naming/tags."
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "azs" {
  description = "Availability zones to spread subnets across. 2 for dev/qa/prod to start (infrastructure/networking.md — single NAT to start, upgrade to per-AZ later if ever needed)."
  type        = list(string)
}

variable "single_nat_gateway" {
  description = "true = one shared NAT Gateway (all envs to start, per infrastructure/networking.md's cost-vs-availability tradeoff). false = one per AZ. Ignored when create_vpc = false."
  type        = bool
  default     = true
}

# --- Bring-your-own-VPC mode ---
#
# true (default): this module provisions its own VPC/IGW/subnets/NAT,
# exactly as it always has.
#
# false: nothing above is created — the module instead treats
# existing_vpc_id / existing_*_subnet_ids / existing_private_isolated_route_table_id
# as the source of truth and passes them straight through its outputs,
# so every downstream module (security-groups, rds, rds-proxy,
# vpc-endpoints, every service's Lambda/ECS subnet_ids, cloudwatch's
# NAT alarms) keeps working unmodified regardless of which mode
# produced the IDs it's consuming.
#
# This module has no way to verify a reused subnet actually has the
# routing infrastructure.md's tier names promise (in particular: that
# an "existing_private_isolated" subnet genuinely has no route to a
# NAT Gateway or Internet Gateway) — that's on you to confirm before
# setting create_vpc = false, the same way it would be if you were
# reviewing a plan for this module creating them fresh.
variable "create_vpc" {
  description = "true = provision a new VPC (default, current behavior). false = reuse an existing VPC via the existing_* variables below instead."
  type        = bool
  default     = true
}

variable "existing_vpc_id" {
  description = "Required when create_vpc = false. VPC ID to reuse (e.g. via `aws ec2 describe-vpcs`)."
  type        = string
  default     = null
}

variable "existing_public_subnet_ids" {
  description = "Required when create_vpc = false. Subnets with a route to an Internet Gateway — NAT Gateway ENIs and the Directus/Medusa admin ALBs land here."
  type        = list(string)
  default     = []
}

variable "existing_private_isolated_subnet_ids" {
  description = "Required when create_vpc = false. Subnets with NO route to NAT/IGW at all — RDS, RDS Proxy, and the read-heavy Catalog/Feed/Search/Identity/publisher-import Lambdas + Directus ECS live here."
  type        = list(string)
  default     = []
}

variable "existing_private_nat_subnet_ids" {
  description = "Required when create_vpc = false. Subnets that route 0.0.0.0/0 through a NAT Gateway — Commerce Lambda and Medusa ECS (Razorpay egress) live here."
  type        = list(string)
  default     = []
}

variable "existing_private_isolated_route_table_id" {
  description = "Required when create_vpc = false. Route table attached to the private-isolated subnets — modules/vpc-endpoints associates the S3 gateway endpoint with it."
  type        = string
  default     = null
}

variable "existing_nat_gateway_ids" {
  description = "Optional, only used when create_vpc = false. Feeds modules/cloudwatch's NAT Gateway alarms — leave empty if you don't want those wired to the reused infrastructure."
  type        = list(string)
  default     = []
}
