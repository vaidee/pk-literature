variable "environment" {
  type = string
}

variable "domain_name" {
  description = "Root domain for this environment, e.g. dev.pk-literature.example (placeholder — set the real domain before first apply)."
  type        = string
}

variable "create_hosted_zone" {
  description = "true to create a new Route53 hosted zone, false to look up an existing one by domain_name."
  type        = bool
  default     = true
}
