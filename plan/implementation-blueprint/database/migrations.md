# Migrations

**Proposed (needs sign-off before Phase 0 lands it):** `node-pg-migrate`
for versioned, hand-written SQL migrations, plus `Kysely` (with
`kysely-codegen`) as the type-safe query builder in each NestJS service.

Rationale: the DDL in `plan/database/ddl/` is hand-authored, not
generated from an ORM schema — SPEC-15 treats the DDL as the source of
truth that the docs describe, not the other way around. A schema-first
tool (Prisma, Drizzle-as-schema-source) would invert that and fight the
"each service owns its own schema's migrations" rule in
`repository-layout.md`. Plain SQL migrations + a query builder that
introspects the resulting DB for types keeps the DDL authoritative and
still gives type safety in `packages/contracts` without an ORM's
cross-schema assumptions.

## Rules

- One migration directory per owning service (e.g.
  `apps/api-catalog/migrations/` owns `catalog` + `staging`).
- Every service after `api-catalog` must pass its own
  `--migrations-table pgmigrations_<service>` to `node-pg-migrate`
  (see any service's `package.json` `migrate:*` scripts for the exact
  flag). Discovered running Phase 4's migrations for real: all
  services share one physical database, and `node-pg-migrate`'s
  default tracking table (`pgmigrations`) is a single table in
  `public` — a second service migrating against the same default table
  makes `node-pg-migrate` apply its own `checkOrder` validation across
  *every* row in that table, including rows from directories it was
  never pointed at, and it fails outright (`Can't determine timestamp`,
  `is preceding already run migration`). `api-catalog` keeps the bare
  default name since it was there first and is already deployed;
  changing it now would be a breaking rename for no benefit. Every
  service after it needs its own table to keep its migration history
  independent.
- Migrations are forward-only in shared environments (qa/prod) — no
  down-migrations run outside local dev. Fix-forward instead.
- Every migration file corresponds to one logical change and is named
  `<timestamp>_<description>.sql`.
- CI runs every service's pending migrations against a throwaway
  Postgres before merge (see `development/testing.md`).
- The initial `catalog`/`staging` migration for Phase 1 is the DDL
  already written in `plan/database/ddl/catalog.sql` and `staging.sql` —
  split into ordered migration files when `apps/api-catalog` is
  scaffolded, not rewritten.
