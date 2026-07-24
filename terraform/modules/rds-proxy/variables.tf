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
  description = "true = clients authenticating with the master secret must use an IAM auth token, not a stored password (infrastructure/secrets.md's preferred path) — since RDS doesn't support IAM auth for the master user at all, true effectively means the master can never connect through this proxy. Only governs the master secret's own auth entry; see additional_auth_secret_arns for services that always use a stored password regardless of this flag."
  type        = bool
  default     = true
}

variable "additional_auth_secret_arns" {
  description = "Extra Secrets Manager secret ARNs (beyond the master credential) whose DB users connect with a stored password, unconditionally (iam_auth = DISABLED) — e.g. Directus/Medusa's own DB-role secrets, whose Postgres clients have no dynamic IAM token refresh support."
  type        = list(string)
  default     = []
}
