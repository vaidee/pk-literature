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
  description = "Security group allowing HTTPS from the private-isolated tier to interface endpoints this module creates. Required whenever anything is actually created — either create_endpoints = true, or create_endpoints = false with a non-empty interface_endpoints_to_create."
  type        = string
  default     = null
}

variable "create_endpoints" {
  description = "false to reuse pre-existing VPC endpoints instead of creating new ones — see main.tf's header comment for why. When false, per-service disposition is split further: services NOT already present in the reused VPC still need creating (interface_endpoints_to_create), while the ones that ARE already present are reused via existing_interface_endpoint_sg_ids/consumer_security_group_ids instead."
  type        = bool
  default     = true
}

variable "interface_endpoints_to_create" {
  description = "Only used when create_endpoints = false. Which of local.interface_endpoint_services to actually create (using endpoint_security_group_id) because they do NOT already exist in the reused VPC — confirmed per-service via `aws ec2 describe-vpc-endpoints`, not assumed. Any service in local.interface_endpoint_services but not in this list is treated as already-reused instead (existing_interface_endpoint_sg_ids/consumer_security_group_ids)."
  type        = list(string)
  default     = []
}

variable "existing_interface_endpoint_sg_ids" {
  description = "Only used when create_endpoints = false. Security group(s) already attached to the account's existing (reused, not created by interface_endpoints_to_create) interface endpoints."
  type        = list(string)
  default     = []
}

variable "consumer_security_group_ids" {
  description = "Only used when create_endpoints = false. Map of a short, caller-chosen name (e.g. \"lambda_db\", \"migration_runner\") to each security group (Lambda/ECS) that needs to reach the existing (reused) interface endpoints — each value gets an ingress rule added to every existing_interface_endpoint_sg_ids entry. A map, not a list: the for_each below needs a plan-time-known key, and a brand-new consumer security group's .id isn't known until after it's created in the same apply — the map's keys (plain strings the caller writes) are known regardless, only the values (the actual .id references) are deferred. Endpoints this module creates itself (interface_endpoints_to_create) are reached via endpoint_security_group_id's own ingress rules instead, managed in terraform/modules/security-groups, not here."
  type        = map(string)
  default     = {}
}
