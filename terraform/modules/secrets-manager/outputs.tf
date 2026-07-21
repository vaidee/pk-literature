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
