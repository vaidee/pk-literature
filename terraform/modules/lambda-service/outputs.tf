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

# The plain Lambda ARN (qualified with the alias), as opposed to
# alias_invoke_arn's API-Gateway-specific URI format — this is what
# non-API-Gateway invokers need, e.g. an aws_cloudwatch_event_target's
# `arn` (Phase 7's UserRegistered consumer, environments/<env>/
# api-commerce.tf, is the first thing in this repo to need it).
output "alias_arn" {
  value = aws_lambda_alias.live.arn
}

output "alias_name" {
  value = aws_lambda_alias.live.name
}

output "role_arn" {
  value = aws_iam_role.this.arn
}
