output "state_bucket_name" {
  value = aws_s3_bucket.terraform_state.id
}

output "state_lock_table_name" {
  value = aws_dynamodb_table.terraform_locks.id
}

output "github_oidc_provider_arn" {
  value = aws_iam_openid_connect_provider.github_actions.arn
}

output "gha_deploy_role_arns" {
  description = "Role ARN per environment — used to fill in .github/workflows/*.yml's role-to-assume, and as the environments/<env>/backend.tf state key namespace."
  value       = { for env, role in aws_iam_role.gha_deploy : env => role.arn }
}

output "directus_ecr_repository_url" {
  value = aws_ecr_repository.directus.repository_url
}
