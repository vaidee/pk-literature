output "rds_master_secret_arn" {
  value = aws_secretsmanager_secret.rds_master.arn
}

output "rds_master_username" {
  value = var.rds_master_username
}

output "rds_master_password" {
  value     = random_password.rds_master.result
  sensitive = true
}

output "directus_db_username" {
  value = var.directus_db_username
}

output "directus_db_password_secret_arn" {
  value = aws_secretsmanager_secret.directus_db.arn
}

output "directus_key_secret_arn" {
  value = aws_secretsmanager_secret.directus_key.arn
}

output "directus_secret_secret_arn" {
  value = aws_secretsmanager_secret.directus_secret.arn
}

output "directus_admin_email" {
  value = var.directus_admin_email
}

output "directus_admin_password_secret_arn" {
  value = aws_secretsmanager_secret.directus_admin.arn
}
