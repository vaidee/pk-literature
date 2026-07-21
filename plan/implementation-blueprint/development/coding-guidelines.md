# Coding Guidelines

## Language/style

- TypeScript everywhere, `strict: true`, no `any` without a `// why`
  comment — matches the general project standard of not writing
  comments except to explain a non-obvious constraint.
- Shared `packages/eslint-config` and `packages/tsconfig` — every app
  extends these, no per-app rule drift.
- Errors follow RFC7807 problem-details (`plan/contracts/errors/problem-details.md`)
  at every API boundary — no ad hoc `{ error: "message" }` shapes.

## NestJS services

- One module per bounded concern within a service (e.g. `api-catalog`
  has a `works` module and a `books` module, not one giant `catalog`
  module) — mirrors the aggregate roots in SPEC-15.
- DTOs and validation live at the controller boundary
  (`class-validator`); domain/query logic never trusts unvalidated
  input, even though every catalog write ultimately comes from a
  service we also control (Directus, the ingest Lambda) — validate at
  the boundary anyway, since "we control the caller today" doesn't hold
  forever.
- DB access via **Kysely** (see `database/migrations.md`), typed against
  the schema generated from the actual DDL — no raw string SQL outside
  the query builder except where Kysely genuinely can't express
  something (rare; comment why when it happens).
- A service never imports another service's internal modules — only
  `packages/contracts` types cross the boundary. Enforced by an ESLint
  import-boundary rule (see the monorepo-tooling discussion in
  `repository-layout.md` — this was the cheap alternative to adopting
  Nx just for its dependency-graph enforcement).

## Frontend

- Server Components by default; Client Components only where
  interactivity requires it (Like button, cart drawer, search-as-you-type).
- shadcn/ui components are copied into `packages/ui` and owned there,
  not left scattered per-app — `apps/web` consumes them from the
  package even though there's only one consumer today, since a second
  UI surface is plausible (Directus already exists as a separate admin
  surface; an internal ops tool is not implausible).
- No business logic in the frontend (PRD: "Calls backend APIs only. No
  business logic.") — ranking, validation, pricing all stay server-side.

## Commits / PRs

- Conventional-commit-style prefixes (`feat:`, `fix:`, `docs:`,
  `chore:`) are encouraged but not enforced by CI — not worth a commit-
  msg linter at this repo size yet.
- A PR into a phase branch should be reviewable in one sitting; split
  large features into sequential PRs within the phase branch rather than
  one sprawling PR.
