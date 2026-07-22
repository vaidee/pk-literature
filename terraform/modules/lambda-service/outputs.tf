output "function_name" {
  value = aws_lambda_function.this.function_name
}

output "function_arn" {
  value = aws_lambda_function.this.arn
}

# API Gateway integrations point at the ALIAS's invoke ARN, not the bare
# function — that's what makes moving the alias (rollback.md) actually
# change what API Gateway invokes without a Terraform apply.
output "alias_invoke_arn" {
  value = aws_lambda_alias.live.invoke_arn
}

output "alias_name" {
  value = aws_lambda_alias.live.name
}

output "role_arn" {
  value = aws_iam_role.this.arn
}
