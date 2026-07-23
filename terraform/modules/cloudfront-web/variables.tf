variable "environment" {
  type = string
}

variable "domain_name" {
  type = string
}

variable "cloudfront_certificate_arn" {
  description = "Must be an ACM cert in us-east-1 — see modules/route53-acm. Same cert as modules/cloudfront (it covers domain_name itself, not just *.domain_name)."
  type        = string
}

variable "hosted_zone_id" {
  type = string
}

variable "static_assets_bucket_id" {
  type = string
}

variable "static_assets_bucket_arn" {
  type = string
}

variable "static_assets_bucket_regional_domain_name" {
  type = string
}

variable "server_function_url_domain" {
  type = string
}

variable "server_function_arn" {
  type = string
}

variable "image_function_url_domain" {
  type = string
}

variable "image_function_arn" {
  type = string
}
