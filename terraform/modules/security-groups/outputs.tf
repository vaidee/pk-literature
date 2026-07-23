output "rds_sg_id" {
  value = aws_security_group.rds.id
}

output "rds_proxy_sg_id" {
  value = aws_security_group.rds_proxy.id
}

output "lambda_db_sg_id" {
  value = aws_security_group.lambda_db.id
}

output "lambda_egress_sg_id" {
  value = aws_security_group.lambda_egress.id
}

output "vpc_endpoints_sg_id" {
  value = aws_security_group.vpc_endpoints.id
}

output "alb_admin_sg_id" {
  value = aws_security_group.alb_admin.id
}

output "ecs_directus_sg_id" {
  value = aws_security_group.ecs_directus.id
}

output "ecs_medusa_sg_id" {
  value = aws_security_group.ecs_medusa.id
}
