# migration-runner

A one-off Lambda, not a service. It exists solely to run
`node-pg-migrate` against the real RDS instance from *inside* the VPC
(RDS is `private-isolated` — no NAT, no Internet Gateway, unreachable
from a GitHub Actions runner or from CloudShell in default network
mode). See `plan/implementation-blueprint/runbooks/deploy.md` §4 for
the full picture; this README only covers what's specific to this app.

## What it does

`src/index.ts`'s `handler` runs each of `api-catalog`, `api-feed`,
`api-search`, `api-commerce`, `api-identity`'s own `migrations/*.sql`
files via node-pg-migrate's programmatic `runner()`, in that fixed
order — `api-catalog` first, because the other four's own
`*_role.sql` migrations grant against schemas/roles it creates.
(`api-publisher-import` has no migrations of its own; its DB role is
created by `api-catalog`'s.)

Connects with the RDS master credential
(`/pk-literature/<env>/rds/master`), fetched from Secrets Manager at
cold start (`src/resolve-master-credential.ts`) — never a plain
Lambda environment variable, per `infrastructure/secrets.md`. It has
to be the master user: the app DB roles are what these migrations
*create*, so nothing else can run them from a cold start.

## Not a normal service

- **No HTTP trigger, no API Gateway route.** `terraform/environments/<env>/migration-runner.tf`
  only creates the Lambda + its IAM role — applying it changes nothing
  at runtime. It runs only when explicitly invoked:

  ```sh
  aws lambda invoke \
    --function-name pk-literature-<env>-migration-runner \
    --cli-binary-format raw-in-base64-out \
    --payload '{}' \
    out.json
  ```

  `{"direction": "down"}` reverts the most recent migration per
  service (services run in reverse order) — same one-migration-at-a-time
  default as each service's own `pnpm migrate:down`, not a full
  rollback.

- **Not built or invoked by `terraform-apply.yml`.** A migration run
  is a deliberate action, not a side effect of every infra apply —
  mirrors how `build-directus-image.yml`/`build-medusa-image.yml` are
  separate, manual-trigger-only workflows.

## Packaging

`scripts/package-lambda.sh` builds this app, then — unlike every other
service's `package-lambda.sh` — also copies each of the 5 services'
`migrations/` directories into the deployment package (they live in
sibling app directories this Lambda would otherwise never see at
runtime), before zipping. Must be re-run whenever this app's code
changes *or* whenever any of those 5 services gains a new migration
file.

## Known limitation

This has been built and typechecks, and the packaging script has been
run end-to-end locally to confirm the zip's layout (`dist/src/index.js`
+ `migrations/<service>/*.sql` at the zip root) is correct — but it has
not yet been invoked against a real deployed RDS instance, because
nothing in this repo could reach one until this Lambda existed. Same
disclosed-limitation pattern as `apps/directus/README.md`'s and
`apps/medusa/README.md`'s "Known issue" sections.
