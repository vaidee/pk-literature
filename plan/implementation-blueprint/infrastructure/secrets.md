# Secrets

## Naming convention

`/pk-literature/<env>/<service>/<key>` — e.g.
`/pk-literature/prod/razorpay/api-key`,
`/pk-literature/prod/publishers/kalachuvadu/api-token`,
`/pk-literature/dev/directus/admin-password`.

## Inventory

| Path prefix                       | Contents | Read by |
|--------------------------------------|----------|---------|
| `/<env>/rds/master`                    | RDS master username/password (rotated automatically, 30-day) | Terraform (bootstrap only) — app services use RDS Proxy IAM auth, not this secret |
| `/<env>/razorpay/*`                      | API key + secret, webhook signing secret | `lambda-api-commerce`, `ecs-medusa` |
| `/<env>/directus/*`                        | Admin bootstrap credentials, DB connection secret, session secret | `ecs-directus` |
| `/<env>/medusa/*`                            | Admin bootstrap credentials, DB connection secret, JWT/cookie secrets | `ecs-medusa` |

## Rules

- Nothing is ever passed as a plain Lambda/ECS environment variable —
  environment variables hold the Secrets Manager ARN, the runtime
  resolves it at cold start.
- RDS Proxy uses **IAM database authentication** for all Lambda/ECS
  connections where possible, not a shared stored password — removes an
  entire class of secret-rotation problem for the highest-traffic path.
  The master password in Secrets Manager exists only for Terraform/
  migration-runner bootstrap.
- Razorpay webhook signature verification (SPEC-06/SPEC-13) reads the
  signing secret from Secrets Manager on every webhook call — never
  cached beyond the Lambda execution environment's lifetime.
- Per-publisher adapter credentials (API tokens, Basic Auth) live in
  **GitHub Actions secrets, not AWS Secrets Manager**, since the adapter
  crawler runs externally as a GitHub Actions workflow and never has AWS
  credentials beyond the one scoped OIDC role that can call the
  staging-ingest API (ADR-009, `iam.md`). Scoped per-publisher via
  GitHub Actions environment secrets, one environment per publisher
  code, so one publisher's workflow run cannot read another's token.
- No secret is ever committed to the repo, including in Terraform
  `.tfvars` — those hold Secrets Manager references/ARNs only.
