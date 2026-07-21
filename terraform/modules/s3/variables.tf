variable "environment" {
  type = string
}

variable "force_destroy" {
  description = "true for dev/qa (teardown convenience per runbooks/teardown.md) — never true for prod, so a destroy attempt against a non-empty bucket fails loudly instead of silently deleting uploaded media."
  type        = bool
  default     = false
}

