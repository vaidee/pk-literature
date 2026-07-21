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
  description = "Security group allowing HTTPS from the private-isolated tier to the interface endpoints."
  type        = string
}
