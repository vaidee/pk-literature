# Testing

## Frameworks

- NestJS services (`apps/api-*`): **Jest** — framework default, least
  friction, good NestJS testing-module support for mocking providers.
- Frontend (`apps/web`): **Vitest** + React Testing Library for
  component/unit tests — faster and more ESM-native than Jest for a
  Next.js app; no reason to pay Jest's config overhead here just for
  consistency with the backend.
- End-to-end: **Playwright**, browser-driven against a running `web` +
  API stack. (The sandbox/dev environment already ships Chromium
  pre-configured for Playwright — reuse that, don't add another browser
  automation tool.)
- `packages/adapter-sdk`: Jest, since it's consumed by both a Jest-based
  Lambda (`api-publisher-import`) and a plain Node.js GitHub Actions
  runner (`publisher-crawler`) — framework-agnostic code either way, but
  Jest for its own test suite keeps it consistent with the services that
  consume it.

## Layers

- **Unit**: pure logic — validation rules, ranking/scoring functions,
  normalization (SPEC-04 §14), duplicate-detection scoring. No network,
  no DB. Fast, run on every commit.
- **Integration**: a real Postgres (via `docker-compose` locally, a
  throwaway RDS-equivalent container in CI) with that service's
  migrations applied fresh. Exercises actual SQL — the DB triggers
  (`catalog.enforce_book_work_status`, `set_updated_at`), constraints,
  and the search-vector trigger are integration-test territory, not
  unit-test territory, since they only exist in the database.
- **Contract**: request/response shapes validated against
  `plan/contracts/openapi/openapi.yaml` — catches drift between the spec
  and the implementation before it reaches an integration environment.
- **E2E**: Playwright, golden-path flows only (browse feed → like → add
  to cart → checkout; editor approves an import → book appears on
  storefront). Expensive to run and maintain — kept deliberately small,
  not a substitute for unit/integration coverage.

## CI gates (see `spec-12-cicd.md`)

- PR to any branch: lint + unit tests, always.
- PR into `main`: adds integration tests (fresh migrations + real
  Postgres) and contract tests.
- Merge to `main` → dev deploy: adds E2E smoke tests post-deploy.
- No hard coverage percentage gate at the repo level — coverage
  thresholds, where set, are per-package (e.g. `packages/adapter-sdk`'s
  validation/normalization logic warrants higher coverage than `apps/web`
  UI code) and configured in that package, not enforced globally.

## Test data

Fixtures live next to the service that owns the schema (e.g.
`apps/api-catalog/test/fixtures`), not in a shared package — avoids
fixtures silently coupling services that shouldn't know about each
other's internal shapes. Seed data for local dev (`scripts/seed`) is
separate from test fixtures and is allowed to be larger/more realistic
(real-looking Tamil titles, not `Test Book 1`).
