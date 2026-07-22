variable "environment" {
  type = string
}

variable "rds_master_username" {
  type    = string
  default = "pk_literature_admin"
}

variable "directus_db_username" {
  description = "Matches the DB role created by migration 20260101000006_directus_app_role.sql."
  type        = string
  default     = "directus_app"
}

variable "directus_admin_email" {
  type    = string
  default = "admin@pk-literature.example"
}
