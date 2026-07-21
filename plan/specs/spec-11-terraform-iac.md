# SPEC-11 --- Terraform Infrastructure as Code

Version: 1.1

## Layers

`bootstrap/` (state bucket, lock table, GitHub OIDC provider, deploy
roles, ECR — applied once, manually, human-run) and `environments/`
(everything else, applied routinely by CI). See
`infrastructure/terraform-layout.md` for the full rationale — this
split exists specifically so environment teardown can never revoke CI's
own ability to rebuild.

## Modules

networking (vpc, vpc-endpoints), security-groups, cloudfront, opennext,
api-gateway, lambda, ecs-service, alb, rds, rds-proxy, s3, iam,
secrets-manager, eventbridge, cloudwatch.

## Environments

dev/, qa/, prod/ — see `infrastructure/terraform-layout.md`.

## State

Remote S3 backend (created by `bootstrap/`) + DynamoDB locking, one
state file per environment.

## CI

`terraform fmt`, `validate`, `plan`, `apply` — targets `environments/`
only; `bootstrap/` is never touched by CI (see `terraform-layout.md`).

## Teardown

`terraform destroy` against any `environments/<env>/` is a supported
operation (`runbooks/teardown.md`), not just a theoretical capability —
it must be exercised routinely enough on dev/qa that it's trusted, not
just documented.

## Acceptance

- Entire platform reproducible from Terraform; no ClickOps outside the
  one-time `bootstrap/` layer.
- Any environment can be destroyed and rebuilt via CI alone, with the
  state bucket, lock table, OIDC provider, and deploy roles surviving
  the teardown untouched.
