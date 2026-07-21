variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_isolated_subnet_ids" {
  type = list(string)
}

variable "rds_sg_id" {
  type = string
}

variable "master_username" {
  type = string
}

variable "master_password" {
  type      = string
  sensitive = true
}

variable "instance_class" {
  description = "e.g. db.t4g.micro for dev/qa, db.t4g.medium for prod (infrastructure/cost-estimation.md)."
  type        = string
  default     = "db.t4g.micro"
}

variable "allocated_storage_gb" {
  type    = number
  default = 20
}

variable "multi_az" {
  description = "false for dev/qa/early-prod per infrastructure/cost-estimation.md — revisit once uptime requirements justify it."
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "true for prod — prevents accidental terraform destroy / console deletion of the instance itself, independent of the Terraform-level state protections."
  type        = bool
  default     = false
}

variable "skip_final_snapshot" {
  description = "false for prod (runbooks/backup.md — a destroy must never skip the final snapshot in prod). true acceptable for dev/qa."
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  type    = number
  default = 7
}
