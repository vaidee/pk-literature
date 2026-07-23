variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "vpc_cidr" {
  description = "Egress rules to the VPC endpoints use this (not a security-group reference) because the endpoints may be ones this Terraform config doesn't own/create (modules/vpc-endpoints' create_endpoints = false path reuses pre-existing endpoints with their own, unmanaged security groups) — a CIDR-scoped rule works the same regardless of which security group actually sits on the destination ENI."
  type        = string
}
