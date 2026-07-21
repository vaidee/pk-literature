variable "environment" {
  type = string
}

variable "rds_instance_id" {
  type = string
}

variable "rds_proxy_name" {
  type = string
}

variable "nat_gateway_ids" {
  type = list(string)
}

variable "api_gateway_id" {
  type = string
}

variable "alarm_email" {
  description = "Where SNS alarm notifications go. Placeholder — set before first apply."
  type        = string
}
