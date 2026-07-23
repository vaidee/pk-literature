variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "private_isolated_route_table_ids" {
  description = "Route table(s) for the private-isolated tier — the S3 gateway endpoint attaches to these."
  type        = list(string)
}

variable "private_isolated_subnet_ids" {
  description = "Subnets for the private-isolated tier — interface endpoint ENIs attach here."
  type        = list(string)
}

variable "endpoint_security_group_id" {
  description = "Security group allowing HTTPS from the private-isolated tier to the interface endpoints. Required when create_endpoints = true; unused (may be left null) otherwise."
  type        = string
  default     = null
}

variable "create_endpoints" {
  description = "false to reuse pre-existing VPC endpoints (S3 gateway + secretsmanager/events/logs/ecr.api/ecr.dkr interface) instead of creating new ones — see main.tf's header comment for why. When false, existing_interface_endpoint_sg_ids and consumer_security_group_ids must both be set."
  type        = bool
  default     = true
}

variable "existing_interface_endpoint_sg_ids" {
  description = "Only used when create_endpoints = false. Security group(s) already attached to the account's existing secretsmanager/events/logs/ecr.api/ecr.dkr interface endpoints."
  type        = list(string)
  default     = []
}

variable "consumer_security_group_ids" {
  description = "Only used when create_endpoints = false. Security groups (Lambda/ECS) that need to reach the existing interface endpoints — each gets an ingress rule added to every existing_interface_endpoint_sg_ids entry."
  type        = list(string)
  default     = []
}
