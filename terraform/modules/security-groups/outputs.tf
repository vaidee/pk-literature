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
