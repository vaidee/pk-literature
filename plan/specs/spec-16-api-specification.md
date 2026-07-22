# SPEC-16 --- API Specification

REST APIs, by domain (see each domain's own spec for the full list):

- Catalog (SPEC-02) — **read-only**: GET /works, GET /works/{id},
  GET /books, GET /books/{id}, GET /authors, GET /publishers,
  GET /collections, GET /themes, GET /genres. No catalog service ever
  accepts a write — `catalog` writes happen through Directus directly
  against Postgres (SPEC-03), never through this API layer. `staging`
  has one additional write path beyond Directus's own editorial edits:
  the staging-ingest API below (SPEC-04/ADR-009) — still not a public
  endpoint, and still never `catalog` itself.
- Discovery (SPEC-05, SPEC-08) — GET /feed, GET /feed/shelf/{id},
  POST /interest/like, GET /search, GET /autocomplete, GET /browse/*,
  GET /books/{id}/similar.
- Commerce (SPEC-06) — POST /cart, GET /cart, PATCH /cart/items,
  DELETE /cart/items/{id}, POST /checkout, POST /payments/create-order,
  POST /payments/webhook, GET /orders, GET /orders/{id}.
- Identity (SPEC-07) — POST /auth/login, POST /auth/logout,
  POST /auth/register, GET /profile, PATCH /profile, GET /addresses,
  POST /addresses, PATCH /addresses/{id}, DELETE /addresses/{id}.
- Publisher import (SPEC-04, ADR-009) is **not** a public API —
  discover/fetch/normalize run outside AWS as a GitHub Actions
  workflow (cron or `workflow_dispatch`, not EventBridge-triggered),
  which then calls the staging-ingest API
  (`GET /publishers/{id}/cursor`, `POST /publishers/{id}/import-runs`,
  `POST /import-runs/{id}/books`, `POST /import-runs/{id}/complete`).
  Every staging-ingest route requires AWS_IAM authorization (SigV4,
  the `gha-publisher-import-<env>` role) — there is no
  externally-callable, unauthenticated route here, unlike Catalog/
  Discovery's genuinely public reads.

Standards: OpenAPI 3.1, JSON, versioned (/v1), idempotency keys for
mutations (cart/checkout/payments), RFC7807 problem-details errors
(`plan/contracts/errors/problem-details.md`).

Authentication: Public (Catalog, Discovery reads), Customer JWT
(Commerce, Identity authenticated routes — anonymous UUID cookie for
unauthenticated cart/checkout/likes per SPEC-07), Editorial (Directus
only, not exposed through this API layer at all), AWS_IAM/SigV4
(Publisher import's staging-ingest routes only — the one place this
API layer authenticates a machine caller via AWS credentials rather
than a cookie/JWT, since the caller is a GitHub Actions workflow, not
an end user).

Acceptance: every endpoint documented with request/response schemas in
`plan/contracts/openapi/openapi.yaml` (currently a stub covering only a
handful of paths — needs full schemas filled in per-phase, as each
domain's implementation starts).
