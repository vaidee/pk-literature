# ADR-009: Externalize Publisher Adapter Execution; Shrink the NAT Tier

## Status

Accepted

## Context

The original SPEC-04 design ran publisher adapters as AWS Lambda
functions, triggered by an EventBridge schedule, living inside the VPC.
Because adapters crawl arbitrary publisher websites/APIs, those Lambdas
needed outbound internet access — meaning a NAT Gateway. Reviewing the
NAT footprint (`infrastructure/networking.md`) surfaced that this was
the majority of what justified having a NAT Gateway at all: of the
services needing real internet egress, only Commerce (Razorpay order
creation) and Medusa (Razorpay refunds) have a hard requirement to run
*inside* AWS while also reaching the public internet. Publisher
crawling has no such requirement — it doesn't need to be near the
database for most of its work, only for the final write.

A proposal to use an Egress-Only Internet Gateway to avoid NAT cost was
evaluated and rejected: EIGW is IPv6-only, and publisher websites and
Razorpay are not reliably IPv6-reachable — it doesn't address the actual
requirement (IPv4 egress).

## Decision

Split the adapter pipeline at the AWS boundary:

- **`publisher-crawler`** (new app, `packages/adapter-sdk` for the
  shared interface/implementations) runs the `discover()` /
  `fetchBooks()` / `fetchBook()` / `fetchInventory()` / `downloadCover()`
  / `normalize()` steps as a **GitHub Actions scheduled workflow** —
  entirely outside AWS, no VPC, no NAT dependency. Cron replaces the old
  EventBridge-triggered schedule.
- It authenticates to AWS via GitHub Actions OIDC (role
  `gha-publisher-import-<env>`, scoped to `execute-api:Invoke` on one
  API route — nothing else) and POSTs the fetched/normalized payload to
  a **staging-ingest API** (API Gateway + `api-publisher-import` Lambda,
  in the private-isolated subnet tier — no NAT, no outbound internet
  path of its own).
- The staging-ingest Lambda runs `validate()` and duplicate detection
  (both need DB access anyway) and writes to `staging`, unchanged from
  the original design.
- Incremental import state (`SPEC-04 §21`) moves from adapter-local
  storage to `catalog.publishers.last_import_cursor` /
  `last_import_at`, read/written by the external runner through the
  staging-ingest API, since a GitHub Actions runner is stateless between
  runs.
- Per-publisher credentials move from AWS Secrets Manager to GitHub
  Actions secrets, since the runner never holds AWS credentials beyond
  the single scoped OIDC role.
- Directus is also moved out of the NAT tier into private-isolated,
  since nothing in its runtime behavior actually requires internet
  access (only its container image pulls do, and those happen at
  deploy time, not runtime).

Net effect on `infrastructure/networking.md`'s NAT tier: shrinks from
{publisher-import, commerce, Directus, Medusa} to just {commerce,
Medusa} — both of which have a genuine, unavoidable reason (Razorpay)
to be inside the VPC and on the internet at once. NAT Gateway itself is
kept (single, not per-AZ — prior decision) rather than eliminated,
since splitting Commerce's Razorpay call into a separate non-VPC Lambda
was evaluated and rejected as unnecessary complexity in a
payment-critical path for a small, fixed monthly saving.

## Consequences

+ NAT Gateway now serves a much smaller, well-understood footprint.
+ Publisher-import Lambda has no internet path at all — smaller blast
  radius for a component that processes untrusted third-party data by
  design.
+ Adapter crawlers can be developed/debugged/run ad hoc without any AWS
  access at all (just the SDK package + a valid GitHub Actions OIDC
  token), which is also a faster local dev loop than iterating on a
  VPC-attached Lambda.
- The adapter pipeline now spans two runtimes (GitHub Actions + Lambda)
  instead of one, adding an HTTP hop and requiring `validate()` to
  logically split from the rest of the SDK interface at the AWS
  boundary — `packages/adapter-sdk` needs to be usable from both a
  Node.js GitHub Actions runner and a Lambda, which constrains it to
  runtime-agnostic code (already true of typical SDK packages, but
  worth stating).
- Retry semantics now have two layers: the workflow's own retry logic
  (SPEC-04 §23, before ever calling AWS) and whatever the API Gateway/
  Lambda layer does on top — needs to stay coherent so a publisher
  outage doesn't produce duplicate `staging_books` rows (mitigated by
  the existing `UNIQUE (publisher_id, source_ref)` constraint, which
  already makes reprocessing idempotent).

## Related

SPEC-04 (updated to v2.1), `infrastructure/networking.md`,
`infrastructure/iam.md`, `infrastructure/secrets.md`,
`development/repository-layout.md`, `state-machines/publisher-import.md`,
`plan/database/ddl/catalog.sql` (`publishers.last_import_cursor`).
