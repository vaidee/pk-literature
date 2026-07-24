# One-off DB migration runner (runbooks/deploy.md §4, option 3). Not
# wired to API Gateway — no HTTP trigger, no route. Applying this file
# changes nothing at runtime by itself; only an explicit
#   aws lambda invoke --function-name pk-literature-prod-migration-runner \
#     --cli-binary-format raw-in-base64-out --payload '{}' out.json
# ever runs node-pg-migrate against the real RDS instance. Deployment
# package built by apps/migration-runner/scripts/package-lambda.sh —
# must be run before `terraform apply` touches this file, same as
# every other Lambda service.
#
# Reuses lambda_db_sg_id unchanged: it's already permitted to reach
# both the RDS Proxy (5432) and the Secrets Manager interface endpoint
# (terraform/modules/vpc-endpoints) — the same two things every other
# DB-connected Lambda already needs, so no new security-group wiring
# was required for this one.
#
# Connects with the RDS master credential (Secrets Manager, resolved
# at cold start — never a plain Lambda environment variable, per
# infrastructure/secrets.md), not RDS Proxy IAM auth: the app DB roles
# each service's own migrations grant (catalog_api_readonly, etc.)
# don't exist until api-catalog's migrations create them, so nothing
# but the master user can run migrations from a cold start.

locals {
  migration_runner_zip = "${path.module}/../../../apps/migration-runner/dist-lambda.zip"
}

data "aws_iam_policy_document" "migration_runner_secrets" {
  statement {
    effect    = "Allow"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [module.secrets_manager.rds_master_secret_arn]
  }
}

module "lambda_migration_runner" {
  source = "../../modules/lambda-service"

  environment  = "prod"
  service_name = "migration-runner"

  filename         = local.migration_runner_zip
  source_code_hash = filebase64sha256(local.migration_runner_zip)
  handler          = "dist/src/index.handler"
  runtime          = "nodejs20.x"
  memory_size      = 512
  # Runs 5 services' migrations sequentially in one invocation —
  # comfortably under this on a small/empty DB, but well above the app
  # Lambdas' 10s since this isn't a per-request path.
  timeout = 120

  # private-isolated tier, same as every other DB-connected Lambda
  # (infrastructure/networking.md) — reaches RDS Proxy and Secrets
  # Manager purely intra-VPC, no NAT/internet needed.
  subnet_ids         = module.vpc.private_isolated_subnet_ids
  security_group_ids = [module.security_groups.lambda_db_sg_id]

  environment_variables = {
    RDS_MASTER_SECRET_ARN = module.secrets_manager.rds_master_secret_arn
    PGHOST                = module.rds_proxy.proxy_endpoint
    PGPORT                = "5432"
    PGDATABASE            = "pk_literature"
  }

  additional_policy_json   = data.aws_iam_policy_document.migration_runner_secrets.json
  attach_additional_policy = true
}
