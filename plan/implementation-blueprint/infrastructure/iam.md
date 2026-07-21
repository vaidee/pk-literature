# IAM

Least privilege, one role per service — no shared "Lambda execution
role" reused across domains. No long-lived IAM user access keys
anywhere; CI/CD authenticates via GitHub Actions OIDC federation (see
`spec-12-cicd.md`).

## Lambda execution roles

| Role                          | Grants |
|---------------------------------|--------|
| `lambda-api-catalog`              | RDS Proxy connect (IAM DB auth, **read-only** DB user — matches the Catalog API being read-only end to end, SPEC-02); CloudWatch Logs write |
| `lambda-api-feed`                  | RDS Proxy connect (read/write to a future `discovery` schema — interest_profile/interest_event; read-only on `catalog`); CloudWatch Logs write |
| `lambda-api-search`                 | RDS Proxy connect (read-only, `catalog`); CloudWatch Logs write |
| `lambda-api-commerce`                | RDS Proxy connect (read/write `commerce` schema, read-only `catalog` for inventory checks at checkout); Secrets Manager read (`*/razorpay/*`); CloudWatch Logs write |
| `lambda-api-identity`                 | RDS Proxy connect (read/write `identity` schema); CloudWatch Logs write |
| `lambda-api-publisher-import`           | **Isolated tier, no NAT/egress at all** (ADR-009 — the crawler runs externally; this Lambda only ever receives an inbound, already-fetched payload). RDS Proxy connect (write `staging` schema only — **no** grant on `catalog`, enforced at both the IAM and Postgres-role level per SPEC-04's "adapters shall not modify production catalog"); S3 write (raw cover downloads bucket, covers already fetched externally and forwarded); EventBridge put-events; CloudWatch Logs write |

Each role's DB access is additionally constrained by a matching Postgres
role/grant (IAM auth via RDS Proxy maps to a DB user with exactly the
schema privileges above) — the IAM policy alone is not the only
enforcement layer, the DB grants back it up.

## ECS task roles

| Role              | Grants |
|---------------------|--------|
| `ecs-directus`        | RDS Proxy connect (read/write `catalog` + `staging` — Directus is the sole write path into `catalog`, SPEC-03); S3 read/write (covers, logos, banners); Secrets Manager read (`*/directus/*`); EventBridge put-events (`BookPublished`, etc.) |
| `ecs-medusa`            | RDS Proxy connect (read/write `commerce`); Secrets Manager read (`*/medusa/*`, `*/razorpay/*`); EventBridge put-events (`OrderCreated`, `OrderPaid`, ...) |

## External runner roles (GitHub Actions OIDC)

`gha-publisher-import-<env>` — assumed by the scheduled/manual GitHub
Actions workflow that runs the publisher adapter crawlers outside AWS
(ADR-009). Grants only `execute-api:Invoke` on the specific staging-
ingest API Gateway route, plus the matching read route used to fetch
`publishers.last_import_cursor` before a run. No S3, no Secrets Manager,
no direct DB access of any kind — the runner never touches AWS
resources directly, only the one authenticated HTTP endpoint. Per-
publisher credentials (the publisher's own API tokens, not AWS
credentials) are pulled by the workflow from GitHub Actions secrets, not
from AWS Secrets Manager, since the runner has no AWS access beyond that
one API route.

## Deploy roles (GitHub Actions OIDC)

One role per environment (`gha-deploy-dev`, `gha-deploy-qa`,
`gha-deploy-prod`), trust policy scoped to this repo + the specific
branch/environment allowed to assume it (phase branches and `main` can
assume `gha-deploy-dev`; only `main` after qa sign-off can assume
`gha-deploy-prod`). Permissions scoped to exactly the AWS services
Terraform manages — no `AdministratorAccess` anywhere.
