# SPEC-16 --- API Specification

REST APIs: GET /feed GET /search GET /books/{id} POST /interest/like
POST /cart POST /checkout GET /orders POST /publisher/import Standards:
OpenAPI 3.1, JSON, versioned (/v1), idempotency keys for mutations,
RFC7807 errors. Authentication: Public, Customer JWT, Editorial
(Directus). Acceptance: every endpoint documented with request/response
schemas.
