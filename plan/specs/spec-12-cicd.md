# SPEC-12 --- CI/CD

Version: 1.2

GitHub Actions, authenticated to AWS via OIDC federation (no long-lived
access keys — see `infrastructure/iam.md`).

> **Current state (v1.2):** the target pipeline below (auto-promote
> through dev/qa, gated prod) is not yet what's implemented. Right now,
> `terraform-apply.yml` applies **only on manual `workflow_dispatch`,
> for `dev` only** — merging to `main` never applies anything by
> itself, for any environment, and the qa/prod jobs are commented out
> entirely. This was a deliberate simplification while bootstrap/OIDC
> isn't wired up to a real AWS account yet: a GitHub Environment
> protection rule alone was judged not trustworthy as *the* gate, since
> it silently does nothing if a repo admin forgets to configure required
> reviewers (this was caught and fixed for `prod` before it caused a
> problem — see ADR/PR history). `workflow_dispatch`-only is a gate that
> can't be silently unconfigured. Re-enabling qa/prod (still
> workflow_dispatch-gated per-environment, not auto-promote) is a
> deliberate follow-up once dev is proven out, not the target state
> described below in one step.

## Branch strategy

Supersedes the old `main, develop, feature/*` model — see
`development/branching.md` for the full rationale. Summary: long-lived
`phase-<n>-<slug>` branches, `feature/*`/`fix/*` branches within a
phase, `planning/*` for plan-doc-only changes. `main` is always
deployable.

## Pipelines

**On PR to any `phase-*`, `feature/*`, `fix/*`, or `planning/*` branch:**
Lint -> Unit Tests -> Build -> (if `terraform/` changed) `terraform fmt
-check` + `validate` + `plan`. No deploy.

**On PR from a `phase-*` branch into `main`:** same as above, plus
Integration Tests against a throwaway Postgres (migrations applied
fresh — see `development/testing.md`), plus a full `terraform plan` for
every environment whose config changed.

**On merge to `main`:**

```
Build
  ↓
Terraform Apply (dev)         — automatic, no approval gate
  ↓
Deploy OpenNext (dev) → Deploy Lambdas (dev) → Deploy ECS (dev)
  ↓
Smoke Tests (dev)
  ↓
Terraform Apply (qa)          — automatic after dev smoke tests pass
  ↓
Deploy (qa) → Smoke Tests (qa)
  ↓
Manual Approval Gate           — required reviewer sign-off
  ↓
Terraform Apply (prod)
  ↓
Deploy (prod) → Smoke Tests (prod)
```

dev and qa promote automatically on green; prod always requires a human
approval, regardless of how many times dev/qa have already gone green
for that change.

## Acceptance

One-click (i.e. merge-triggered, no manual deploy steps) automated
deployment through dev and qa; prod deployment is one-click *after*
approval. Every environment is provisioned by the same Terraform
modules with only `.tfvars` differing (SPEC-11).
