variable "environment" {
  type = string
}

variable "private_isolated_subnet_ids" {
  type = list(string)
}

variable "rds_proxy_sg_id" {
  type = string
}

variable "db_instance_id" {
  type = string
}

variable "rds_master_secret_arn" {
  type = string
}

variable "require_iam_auth" {
  description = "true = clients (Lambda/ECS) must authenticate with an IAM auth token, not a stored password (infrastructure/secrets.md's preferred path)."
  type        = bool
  default     = true
}
