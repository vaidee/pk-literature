variable "environment" {
  type = string
}

variable "service_name" {
  description = "e.g. \"api-catalog\" — used in resource naming."
  type        = string
}

variable "filename" {
  description = "Path to the deployment package zip, built by that service's scripts/package-lambda.sh."
  type        = string
}

variable "source_code_hash" {
  type = string
}

variable "handler" {
  description = "e.g. \"dist/src/lambda.handler\"."
  type        = string
}

variable "runtime" {
  type    = string
  default = "nodejs20.x"
}

variable "memory_size" {
  type    = number
  default = 512
}

variable "timeout" {
  type    = number
  default = 10
}

variable "environment_variables" {
  type    = map(string)
  default = {}
}

variable "subnet_ids" {
  description = "Which VPC subnet tier this function lives in — private-isolated for DB-only services, private-nat for services needing internet egress (infrastructure/networking.md). Empty list = not in a VPC at all."
  type        = list(string)
  default     = []
}

variable "security_group_ids" {
  type    = list(string)
  default = []
}

variable "log_retention_days" {
  type    = number
  default = 30
}

variable "additional_policy_json" {
  description = "Extra IAM policy JSON (e.g. rds-db:connect) beyond the base execution role. null = no additional policy."
  type        = string
  default     = null
}
