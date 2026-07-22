variable "environment" {
  type = string
}

variable "service_name" {
  description = "e.g. \"directus\" — used in resource naming and the subdomain (<service_name>.<domain_name>)."
  type        = string
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "alb_security_group_id" {
  type = string
}

variable "domain_name" {
  type = string
}

variable "regional_certificate_arn" {
  type = string
}

variable "hosted_zone_id" {
  type = string
}

variable "target_port" {
  type = number
}

variable "health_check_path" {
  type    = string
  default = "/"
}
