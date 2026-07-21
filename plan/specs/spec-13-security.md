# SPEC-13 --- Security

Version: 1.1

## Transport

HTTPS only end to end (CloudFront, API Gateway, admin ALBs) — no plain
HTTP listener anywhere, including internal traffic inside the VPC.

## Identity & access boundaries

Three separate identity domains that never share credentials or session
state, per SPEC-07/SPEC-13's original design:

- **Public/customer**: anonymous UUID cookie or JWT (registered users) —
  scoped to Discovery/Commerce/Identity APIs only.
- **Editorial**: Directus's own auth — has no path to Commerce data at
  all (separate schema, separate admin surface, no shared session).
- **Operations**: Medusa Admin's own auth — has no path to `catalog` at
  all, symmetric with the above.

No IAM user access keys anywhere in the system (services and CI/CD both
use role assumption — see `infrastructure/iam.md`). No shared "god"
credential exists that spans identity/editorial/commerce.

## IAM

Least privilege, one role per service (full matrix in
`infrastructure/iam.md`) — notably the Catalog API's role is read-only
end to end (DB grant, not just IAM policy), and the publisher-import
Lambda's role has no `catalog` write grant at all, matching SPEC-04's
non-goal that adapters cannot modify production. The external adapter
runner (ADR-009) holds the narrowest role in the system:
`execute-api:Invoke` on exactly one route, nothing else.

## Secrets & encryption

Secrets Manager for everything AWS-side (`infrastructure/secrets.md`);
GitHub Actions secrets for the externalized adapter runner's publisher
credentials, since that runner has no AWS Secrets Manager access by
design. RDS storage encryption and Secrets Manager both use AWS-managed
KMS keys by default — no customer-managed KMS key unless a compliance
requirement emerges that AWS-managed keys don't satisfy (none identified
yet; revisit if one does, rather than paying CMK overhead speculatively).

## Application-level

- JWT access + refresh tokens (registered users), HTTP-only + Secure +
  SameSite cookies, CSRF protection on state-changing requests (SPEC-07).
- Rate limiting at API Gateway (per-IP and per-anonymous-UUID) on public
  endpoints, particularly `/interest/like` and `/search`/`/autocomplete`
  (SPEC-08 §27 already calls out query sanitization + no wildcard abuse).
- **Razorpay webhook signature verification is mandatory before any
  order is marked `Paid`** — the browser payment callback is advisory
  only, never trusted to finalize state (SPEC-06). Signing secret read
  fresh from Secrets Manager per call, never cached beyond the Lambda
  execution environment's lifetime (`infrastructure/secrets.md`).
- Publisher adapter inputs are untrusted third-party data by
  construction — SPEC-04's validation engine (duplicate ISBN, invalid
  currency, broken image checks) is a security boundary, not just a data
  quality one; the staging-ingest Lambda re-validates server-side even
  though the external runner may have done a lighter check first
  (defense in depth, not just convenience).

## WAF

AWS WAF in front of CloudFront/API Gateway, **prod only** to start —
managed rule groups (SQLi, common exploits) plus a rate-based rule.
Deferred for dev/qa (low value pre-launch, avoids the per-rule/
per-million-request cost on environments with no real traffic) —
consistent with the dev/qa-cheap, prod-hardened pattern already used for
NAT and RDS sizing (`infrastructure/cost-estimation.md`).

## Audit

Directus's native revisions/activity log is the audit trail for every
`catalog`/`staging` write (SPEC-03, SPEC-15) — no parallel `audit_log`
table, since Directus is the only write path into those schemas.
Commerce/Identity auditability (order history, payment records) is
Medusa's own record-keeping, deferred to Phase 6/7 design.

## Acceptance

- No secret ever committed to the repo (enforced by
  `run_secret_scanning`-style CI check — TBD which tool, tracked as an
  open item for Phase 0).
- Full auditability of every catalog/staging change (via Directus) and
  every order/payment state transition (via Medusa, once built).
- Webhook signature verification blocks any unverified payment
  finalization.
- Editorial, customer, and operations identity domains never share a
  session or credential.
