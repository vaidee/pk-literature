# SPEC-16 --- API Specification

REST APIs, by domain (see each domain's own spec for the full list):

- Catalog (SPEC-02) — **read-only**: GET /works, GET /works/{id},
  GET /books, GET /books/{id}, GET /authors, GET /publishers,
  GET /collections, GET /themes, GET /genres. No catalog service ever
  accepts a write — all catalog/staging writes happen through Directus
  directly against Postgres, not through this API layer.
- Discovery (SPEC-05, SPEC-08) — GET /feed, GET /feed/shelf/{id},
  POST /interest/like, GET /search, GET /autocomplete, GET /browse/*,
  GET /books/{id}/similar.
- Commerce (SPEC-06) — POST /cart, GET /cart, PATCH /cart/items,
  DELETE /cart/items/{id}, POST /checkout, POST /payments/create-order,
  POST /payments/webhook, GET /orders, GET /orders/{id}.
- Identity (SPEC-07) — POST /auth/login, POST /auth/logout,
  POST /auth/register, GET /profile, PATCH /profile, GET /addresses,
  POST /addresses, PATCH /addresses/{id}, DELETE /addresses/{id}.
- Publisher import is **not** a public API — adapters run as scheduled
  Lambda workers (SPEC-04) writing to `staging`. There is no
  `POST /publisher/import` endpoint; imports are triggered by
  EventBridge schedule or an internal manual-trigger call, not by an
  external caller.

Standards: OpenAPI 3.1, JSON, versioned (/v1), idempotency keys for
mutations (cart/checkout/payments), RFC7807 problem-details errors
(`plan/contracts/errors/problem-details.md`).

Authentication: Public (Catalog, Discovery reads), Customer JWT
(Commerce, Identity authenticated routes — anonymous UUID cookie for
unauthenticated cart/checkout/likes per SPEC-07), Editorial (Directus
only, not exposed through this API layer at all).

Acceptance: every endpoint documented with request/response schemas in
`plan/contracts/openapi/openapi.yaml` (currently a stub covering only a
handful of paths — needs full schemas filled in per-phase, as each
domain's implementation starts).
