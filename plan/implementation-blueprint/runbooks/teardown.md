# Runbook — Environment Teardown & Rebuild

Applies to `dev` and `qa` as a routine cost-saving operation; applies to
`prod` only as a disaster-recovery exercise, not something done casually
(see `infrastructure/cost-estimation.md` for the cost motivation and
`terraform-layout.md` for why this is safe by construction).

## What this does NOT touch

Because of the bootstrap/environment split
(`infrastructure/terraform-layout.md`), a teardown targets only
`terraform/environments/<env>/` and structurally cannot reach:

- The Terraform state S3 bucket or its contents (versioned, deletion-protected)
- The DynamoDB state lock table
- The GitHub OIDC identity provider and the `gha-deploy-<env>` /
  `gha-publisher-import-<env>` IAM roles
- ECR container image repositories (shared across environments)
- Any *other* environment's resources or state

The destroyed environment's own state file is **not deleted** either —
`terraform destroy` empties it down to zero tracked resources, but the
S3 object itself remains (with its full version history, since
versioning is on). This is deliberate: it keeps a clean, known-good,
already-authenticated state file ready for the next `terraform apply`,
and preserves history for audit even across a full teardown.

## Before tearing down

1. Confirm which environment. **Never run this against `prod` without
   an explicit incident/DR reason** — check with the team first
   regardless of what CI would technically allow.
2. RDS: for `qa`, take a manual final snapshot if there's data worth
   keeping beyond what nightly backups already cover
   (`runbooks/backup.md`). For `dev`, this is usually unnecessary — dev
   data is expected to be disposable. For `prod`, `terraform destroy`
   must never run without `skip_final_snapshot = false` already set on
   the RDS resource (final snapshot forced, not optional) — this is a
   Terraform resource-level setting, not a step to remember at teardown
   time.
3. S3 media buckets (covers/logos): `dev`/`qa` may set
   `force_destroy = true` so teardown doesn't require manually emptying
   the bucket first; `prod`'s bucket never sets this — a destroy attempt
   against a non-empty, non-force-destroy bucket fails loudly instead of
   silently deleting uploaded media, which is the intended safety net.

## Teardown

```
cd terraform/environments/<env>
terraform plan -destroy    # review — confirm nothing outside this
                            # environment's own resources appears
terraform destroy
```

Run via the same CI pipeline/role as a normal apply
(`gha-deploy-<env>`), not a developer's local credentials, so the
action is logged and reviewable the same way a deploy is.

## Rebuild

```
cd terraform/environments/<env>
terraform apply
```

No bootstrap re-run needed — the state backend, lock table, and CI's
deploy role all still exist and are already trusted. Follow with the
normal deploy pipeline (`spec-12-cicd.md`) to redeploy application code
into the freshly-rebuilt infrastructure.

## Acceptance

- A destroyed `dev`/`qa` environment can be fully rebuilt by CI with no
  manual AWS console steps and no `bootstrap/` changes.
- A teardown, however run, cannot delete the state bucket, lock table,
  OIDC provider, deploy roles, or ECR repos — verified by the fact that
  none of those resources are declared in any `environments/<env>/`
  state file to begin with, not by relying on operator discipline alone.
