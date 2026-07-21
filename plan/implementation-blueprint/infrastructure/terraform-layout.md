# Terraform Layout

```
terraform/
  modules/
    vpc/                 3-tier subnets (public / private-isolated / private-nat), IGW, NAT GW(s)
    vpc-endpoints/        S3 gateway endpoint, interface endpoints (Secrets Manager, EventBridge,
                           CloudWatch Logs, ECR) for the private-isolated tier
    security-groups/       rds, rds-proxy, lambda-db, lambda-egress, ecs-directus, ecs-medusa
    rds/                  Postgres instance, subnet group, parameter group
    rds-proxy/
    lambda/                reusable module: one instantiation per service (api-catalog, api-feed, ...)
    api-gateway/
    ecs-service/            reusable module: one instantiation for directus, one for medusa
    alb/                    Directus/Medusa admin ALBs (public subnet, HTTPS only)
    s3/                     covers/media bucket, publisher-logos bucket
    cloudfront/
    opennext/
    iam/                   roles + policies, see iam.md
    secrets-manager/        see secrets.md
    eventbridge/
    cloudwatch/             log groups, dashboards, alarms

  environments/
    dev/
      main.tf               wires modules together, dev-sized (single NAT, smallest RDS instance class)
      backend.tf             S3 backend, dev state key
      terraform.tfvars
    qa/
      ...                    same shape, qa-sized
    prod/
      ...                    same shape, prod-sized
```

## Module ownership (see `development/branching.md`)

`phase-0-foundations` provisions: `vpc`, `vpc-endpoints`, `security-groups`
(base rules), `rds`, `rds-proxy`, `s3` (base buckets), `iam` (base
roles), `secrets-manager` (bootstrap), `api-gateway` (shell, no routes
yet), `cloudfront`, `opennext`, `eventbridge` (bus only), `cloudwatch`
(base). Every later phase branch adds its own `lambda`/`ecs-service`
module instantiations and wires them into `environments/<env>/main.tf`
in its own PR — it does not modify `phase-0`'s modules.

## State

Remote S3 backend, one state file per environment (`environments/<env>/backend.tf`
each point at a distinct state key — not Terraform workspaces, to avoid
the workspace foot-gun of accidentally applying dev's plan against prod's
state). DynamoDB table for state locking, shared across environments.

## CI

`terraform fmt -check`, `terraform validate`, `terraform plan` on every
PR touching `terraform/`; `terraform apply` only after merge to `main`
and only for the environment(s) affected, gated per SPEC-12's pipeline
(manual approval for qa/prod).

Acceptance: entire platform reproducible from Terraform; no manually
created AWS resources ("ClickOps") outside of one-time bootstrap
(the Terraform state bucket/lock table themselves).
