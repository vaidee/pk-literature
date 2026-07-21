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
  description = "true = one shared NAT Gateway (all envs to start, per infrastructure/networking.md's cost-vs-availability tradeoff). false = one per AZ."
  type        = bool
  default     = true
}
