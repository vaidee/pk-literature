# SPEC-11 --- Terraform Infrastructure as Code

## Modules

networking, vpc, security-groups, cloudfront, opennext, api-gateway,
lambda, ecs-express, rds, rds-proxy, s3, iam, secrets-manager,
eventbridge, cloudwatch. \## Environments dev/, qa/, prod/. \## State
Remote S3 backend + DynamoDB locking. \## CI terraform fmt, validate,
plan, apply. Acceptance: Entire platform reproducible from Terraform.
