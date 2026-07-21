# api-catalog

Read-only Catalog API (SPEC-02, SPEC-16). Serves `GET /v1/works`,
`/v1/works/{id}`, `/v1/books`, `/v1/books/{id}`, `/v1/authors`,
`/v1/authors/{id}`, `/v1/publishers`, `/v1/publishers/{id}`,
`/v1/collections`, `/v1/themes`, `/v1/genres`. No write endpoints exist
by design — see spec-02's "API Surface" note: all `catalog`/`staging`
writes go through Directus (Phase 2) or the staging-ingest API (Phase 3,
`apps/api-publisher-import`), never through this service.

## Local development

```sh
docker compose up -d postgres     # from repo root
cp .env.example .env
pnpm install                       # from repo root
pnpm --filter api-catalog run migrate:up
pnpm --filter api-catalog run start:dev
```

## Migrations

Owns `catalog` + `staging` schema migrations (`database/migrations.md`
— this app owns staging's migrations even though it never *queries*
staging; that's `apps/api-publisher-import`'s job). Forward-only in
qa/prod; `migrate:down` is a local-dev convenience only.

```sh
pnpm run migrate:up      # apply pending migrations
pnpm run migrate:down    # revert the last migration (local dev only)
pnpm run migrate:create <name>
```

## Architecture notes

- **Read-only end to end**: no `POST`/`PATCH`/`DELETE` routes, and the
  DB role this service connects as should be granted `SELECT` only
  (`infrastructure/iam.md`).
- **Kysely, hand-typed against the DDL** (`src/database/database.types.ts`)
  — not generated from a live DB yet (`database/migrations.md`); update
  this file by hand whenever the DDL changes, in the same PR.
- **One module per aggregate root** (`src/works`, `src/books`, ...),
  matching SPEC-15 — see `coding-guidelines.md`.
- **RFC7807 everywhere**: every thrown error becomes a
  `plan/contracts/errors/problem-details.md`-shaped response via
  `ProblemDetailsFilter` — never a bare `{ message }`.
- **Two entry points, one app**: `src/main.ts` (local dev server) and
  `src/lambda.ts` (deployed handler) both call `createApp()` so they
  can never drift on global pipes/filters.
