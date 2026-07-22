# Bootstrap

Applied **once, manually, by a human with admin AWS credentials** — never
by CI. This is the chicken-and-egg layer: CI authenticates via the OIDC
role this creates, so it cannot be what creates it.

State is **local**, not remote — there is no S3 backend yet when this
first runs. Whoever runs this holds `terraform.tfstate` for this
directory; it is not committed to the repo (see `.gitignore`).

See `plan/implementation-blueprint/infrastructure/terraform-layout.md`
for the full rationale behind the bootstrap/environments split, and
`plan/implementation-blueprint/runbooks/teardown.md` for why this layer
specifically must never be destroyed alongside an environment.

## First run

```sh
cd terraform/bootstrap
terraform init
terraform plan
terraform apply
```

## After first apply

1. Take the `gha_deploy_role_arns` output and put each environment's
   role ARN into that environment's GitHub Actions workflow
   configuration (`.github/workflows/terraform-dev.yml` etc. reference
   these via repo/environment variables, not hardcoded — see the
   workflow files).
2. Take `state_bucket_name` / `state_lock_table_name` and fill in each
   `terraform/environments/<env>/backend.tf`.
3. Take the `gha_publisher_import_role_arns` output and put each
   environment's role ARN into `.github/workflows/publisher-import.yml`'s
   `role-to-assume` (same repo/environment-variable convention as step 1
   — see that workflow file).
4. From that point on, `terraform/environments/` is applied by CI, not
   manually.

## Re-running later

Only needed to add a new environment's deploy role, rotate the OIDC
trust policy, or change what AWS services CI is allowed to touch. Not
part of the regular development loop — changes here are reviewed as
plain PRs (no pipeline runs against this directory at all, by design).
