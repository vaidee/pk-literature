# Terraform Layout

## Two layers: bootstrap vs environments

Everything below `terraform/environments/` is routinely destroyable.
`terraform/bootstrap/` is not — it holds the resources that must
outlive any environment teardown: the Terraform state bucket itself,
the state lock table, the GitHub OIDC trust relationship, and the
deploy roles CI authenticates as. If these lived in the same state as
an environment, tearing that environment down would either destroy the
very backend its own state file lives in, or destroy the OIDC role that
CI needs to run `terraform destroy`/`apply` again afterward. Splitting
them out is what makes teardown+rebuild actually safe to do routinely,
not just theoretically possible.

```
terraform/
  bootstrap/                  Applied ONCE, manually, by a human with admin AWS
                              credentials — never by CI (chicken-and-egg: CI
                              authenticates via the role this layer creates, so
                              it cannot be what creates it). Local state file
                              (not S3 — there is no bucket yet when this first
                              runs), committed nowhere, held by whoever bootstraps
                              the account. Re-run only to add a new environment's
                              deploy role or rotate the OIDC trust policy — not
                              part of the regular CI pipeline at all.
    state-backend.tf           S3 bucket (versioned, bucket policy denies
                                s3:DeleteBucket and s3:DeleteObject* except via a
                                break-glass admin role), DynamoDB lock table
    oidc.tf                     GitHub OIDC identity provider (one per AWS
                                 account — AWS itself only allows one per
                                 provider URL) + gha-deploy-{dev,qa,prod} and
                                 gha-publisher-import-{dev,qa,prod} roles
    ecr.tf                       Container registries for Directus/Medusa images
                                 (shared across environments — the same image is
                                 promoted dev -> qa -> prod, so this isn't
                                 per-environment either)

  modules/
    vpc/                 3-tier subnets (public / private-isolated / private-nat), IGW, NAT GW(s)
    vpc-endpoints/        S3 gateway endpoint, interface endpoints (Secrets Manager, EventBridge,
                           CloudWatch Logs, ECR) for the private-isolated tier
    security-groups/       rds, rds-proxy, lambda-db, lambda-egress, ecs-directus, ecs-medusa
    rds/                  Postgres instance, subnet group, parameter group
    rds-proxy/
    lambda-service/        reusable module: one instantiation per service (api-catalog, api-feed, ...).
                           Execution role, log group, versioning + a `live` alias (rollback.md's
                           fast-path rollback target) — the domain-specific bits (handler, VPC
                           placement, extra IAM permissions, API Gateway routes) live in that
                           phase's own environments/<env>/<service>.tf, e.g. api-catalog.tf
    api-gateway/
    ecs-service/            reusable module: one instantiation for directus, one for medusa
    alb/                    Directus/Medusa admin ALBs (public subnet, HTTPS only)
    s3/                     covers/media bucket, publisher-logos bucket
    cloudfront/
    opennext/
    iam/                   roles + policies, see iam.md (includes the gha-publisher-import
                           OIDC role that lets the external adapter runner call the
                           staging-ingest API — see ADR-009)
    secrets-manager/        see secrets.md
    eventbridge/
    cloudwatch/             log groups, dashboards, alarms

  environments/
    dev/
      main.tf               wires modules together, dev-sized (single NAT, smallest RDS instance class)
      backend.tf             S3 backend (the bucket bootstrap/ created), dev state key
      terraform.tfvars
    qa/
      ...                    same shape, qa-sized
    prod/
      ...                    same shape, prod-sized
```

## Module ownership (see `development/branching.md`)

`phase-0-foundations` provisions `bootstrap/` (once, manually — see
above) and the `environments/<env>/` instantiation of: `vpc`,
`vpc-endpoints`, `security-groups` (base rules), `rds`, `rds-proxy`,
`s3` (base buckets), `iam` (base roles), `secrets-manager` (bootstrap
secrets), `api-gateway` (shell, no routes yet), `cloudfront`,
`opennext`, `eventbridge` (bus only), `cloudwatch` (base). Every later
phase branch adds its own `lambda-service`/`ecs-service` module instantiations
and wires them into `environments/<env>/main.tf` in its own PR — it
does not modify `bootstrap/` or touch another phase's modules.

## State

`bootstrap/` uses **local state**, held by whoever runs it — not
remote, since the remote backend doesn't exist yet at that point.
`environments/<env>/` uses the S3 backend `bootstrap/` created: one
state file per environment (`environments/<env>/backend.tf` each point
at a distinct state key inside the *same* shared bucket — not Terraform
workspaces, to avoid the workspace foot-gun of accidentally applying
dev's plan against prod's state). DynamoDB table for state locking,
shared across environments, lock key includes the state path so
concurrent applies to different environments never contend.

## Teardown

`terraform destroy` inside `environments/<env>/` is a supported,
routine operation — see `runbooks/teardown.md` for the actual
procedure and what it does and does not remove. The bootstrap/
environment split is what makes this safe: destroying an environment
can *only* ever reach resources declared in that environment's own
state file, which by construction excludes the state bucket, lock
table, OIDC provider, deploy roles, and ECR repos. Re-running
`terraform apply` in `environments/<env>/` afterward rebuilds it from
scratch against the same (still-existing, still-versioned) state
backend and the same (still-trusted) CI role — no bootstrap re-run
needed.

Primary use case: dev/qa are legitimate to tear down and rebuild
routinely to save the fixed NAT/RDS/ECS run-rate cost
(`infrastructure/cost-estimation.md`) when not in active use — this
was designed to be cheap and safe to do often, not just possible in an
emergency.

## CI

`terraform fmt -check`, `terraform validate`, `terraform plan` on every
PR touching `terraform/environments/` or `terraform/modules/`;
`terraform apply` only after merge to `main` and only for the
environment(s) affected, gated per SPEC-12's pipeline (manual approval
for qa/prod). CI never touches `terraform/bootstrap/` — no pipeline is
wired to it at all; changes there are applied manually and reviewed as
plain PRs for visibility, not executed by automation.

Acceptance: entire platform reproducible from Terraform; no manually
created AWS resources ("ClickOps") outside of the one-time,
human-applied `bootstrap/` layer; any environment can be destroyed and
rebuilt from `environments/<env>/` alone without touching `bootstrap/`.
