# Branching Strategy

## Trunk

`main` is always deployable. Nothing lands on it except via a reviewed PR
from a phase branch or a planning branch.

## Phase branches (long-lived)

One branch per implementation phase, matching `00-implementation-roadmap.md`:

| Branch                        | Phase                      |
|--------------------------------|-----------------------------|
| `phase-0-foundations`          | Infra bootstrap             |
| `phase-1-catalog-domain`       | Catalog                     |
| `phase-2-editorial-workbench`  | Editorial (Directus)        |
| `phase-3-publisher-adapters`   | Publisher Adapter framework |
| `phase-4-discovery-feed`       | Discovery Feed              |
| `phase-5-search`               | Search                      |
| `phase-6-commerce`             | Commerce (Medusa/Razorpay)  |
| `phase-7-identity`             | User & Identity             |
| `phase-8-knowledge-graph`      | Tamil Literature Graph      |
| `phase-9-ai-enrichment`        | AI Enrichment                |

Rules:

- A phase branch is cut from `main` **only after every phase it depends on
  has already merged to `main`** (see dependency order below). Phases do not
  branch from each other directly.
- Phase branches are **long-lived**: after the phase's initial
  implementation merges to `main`, the branch stays alive. Future
  improvements to that domain branch off the phase branch (or off `main`
  and PR into the phase branch — either is fine) and the phase branch
  periodically re-merges into `main`.
- Day-to-day work happens on short-lived `feature/*` or `fix/*` branches
  cut from the relevant phase branch, PR'd back into it. The phase branch
  itself is the integration point for that domain; `main` is the
  integration point across domains.
- A phase branch merges to `main` when its spec's Acceptance Criteria are
  met and CI is green — not necessarily when every "Future Extensions"
  item in the spec is done.

## Dependency order

```
phase-0-foundations
        │
phase-1-catalog-domain
        │
        ├── phase-2-editorial-workbench
        │
        ├── phase-3-publisher-adapters   (needs catalog + editorial staging tables)
        │
        ├── phase-4-discovery-feed
        │        │
        │        └── phase-5-search
        │
        ├── phase-6-commerce             (needs catalog for book references)
        │
        └── phase-7-identity
```

`phase-2` and `phase-3` both need `phase-1` merged first (Directus and the
adapter framework both read/write catalog + staging schema). `phase-4`,
`phase-6`, `phase-7` need `phase-1` merged but are independent of each
other and of `phase-2`/`phase-3` at the branch level, though in practice
Discovery Feed is more useful once Editorial can actually publish books.

## Infra ownership

`phase-0-foundations` holds only genuinely cross-cutting infrastructure:
VPC/networking, Terraform remote state backend, the RDS Postgres instance
and RDS Proxy, base IAM roles, Secrets Manager bootstrap, the API Gateway
shell, and the CI skeleton.

Every later phase owns the Terraform for the infrastructure **its own
services need** and adds it inside its own branch, alongside the
application code — e.g. `phase-2-editorial-workbench` adds the
ECS-Directus Terraform module; `phase-6-commerce` adds the Medusa ECS
service and Razorpay secrets. This keeps each phase deployable end-to-end
from its own branch without waiting on a shared infra bottleneck.

## Planning branches

Changes to `plan/` (specs, ADRs, data model, this document) happen on
`planning/<topic>` branches (e.g. `planning/finalize-specs`) and merge to
`main` directly — phase branches always read plan docs off `main`, so
plan changes should land before the phase work that depends on them
starts, where practical.

## Naming

- `phase-<n>-<slug>` — long-lived phase branch
- `feature/<slug>` — new capability within a phase
- `fix/<slug>` — bug fix within a phase
- `planning/<slug>` — plan/spec/doc changes
