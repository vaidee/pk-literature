# Repository Layout

Single monorepo, pnpm workspaces (no build orchestrator like Turborepo/Nx
until build times justify it — see ADR on tooling).

```
apps/
  web/                    Next.js + OpenNext frontend (Tailwind + shadcn/ui)
  api-catalog/             NestJS Lambda service — Catalog domain
  api-feed/                NestJS Lambda service — Discovery Feed
  api-search/               NestJS Lambda service — Search
  api-commerce/            NestJS Lambda service — Commerce (fronts Medusa)
  api-identity/            NestJS Lambda service — User & Identity
  api-publisher-import/    NestJS Lambda service — Publisher Adapter framework
  directus/                 Directus config, custom collections/extensions, flows
  medusa/                   Medusa config, plugins

packages/
  contracts/                Shared TS types + generated OpenAPI client, event schemas
  domain-types/            Shared DTOs/zod schemas (Book, Author, Order, ...)
  ui/                        Shared shadcn/ui component set (used by web; future admin tools)
  eslint-config/
  tsconfig/

terraform/
  modules/                  Reusable modules (vpc, rds, rds-proxy, lambda, api-gateway,
                             ecs-service, s3, iam, secrets-manager, eventbridge, cloudfront)
  environments/
    dev/
    qa/
    prod/

plan/                       Specs, ADRs, PRD, architecture docs (this tree)
docs/                       Generated/rendered docs (OpenAPI HTML, ERDs) — build output, not source
scripts/                    One-off ops/dev scripts (seed data, migration runners)
```

## Ownership rules

- Each `apps/api-*` service owns its own database migrations for the
  schema(s) it writes to (e.g. `api-catalog` owns `catalog` + `staging`
  schema migrations). No service migrates a schema it doesn't own.
- `packages/contracts` is the only place cross-service/cross-app types are
  defined. If two apps need the same shape, it goes here — never copy-paste
  a type between apps.
- `apps/directus` and `apps/medusa` are configuration, not application
  code: schema/collection definitions, custom extensions, plugin config.
  They deploy as their own containers, not through the Lambda pipeline.
- Terraform for a phase's own services lives in `terraform/modules/` and is
  wired into `terraform/environments/<env>/` by that phase's branch (see
  `branching.md` — infra ownership).
