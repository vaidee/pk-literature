variable "environment" {
  type = string
}

variable "domain_name" {
  type = string
}

variable "cloudfront_certificate_arn" {
  description = "Must be an ACM cert in us-east-1 — see modules/route53-acm."
  type        = string
}

variable "hosted_zone_id" {
  type = string
}

variable "media_bucket_id" {
  type = string
}

variable "media_bucket_arn" {
  type = string
}

variable "media_bucket_regional_domain_name" {
  type = string
}
