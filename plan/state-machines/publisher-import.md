# State Machine — Publisher Import

Two separate lifecycles, both in the `staging` schema (`staging.sql`).
Don't conflate them: an import run can complete even if individual books
in it get rejected.

> **Execution note (ADR-009):** the `running` state now spans a GitHub
> Actions workflow run (external, doing discover/fetch/normalize)
> followed by one or more calls into the staging-ingest Lambda (internal,
> doing validate/duplicate-detect/write). The `import_runs` row is
> created and updated by the external runner via the staging-ingest
> API's write route — it's the same state machine as before, just
> spanning the AWS boundary instead of living entirely inside one Lambda.

## Import Run (`staging.import_runs.status`)

```
running ──▶ completed
   │
   ├──▶ failed              (adapter crashed / fatal error before any books processed)
   └──▶ partially_failed    (some books processed, some failed — e.g. network errors
                              that exhausted retries per SPEC-04 §23)
```

One row per adapter execution (scheduled, manual, or retry — SPEC-04
§9). Tracks aggregate counters (`total_books`, `new_books`,
`updated_books`, `rejected_books`) used for the CloudWatch dashboard
(SPEC-04 §24) and reported via the `ImportCompleted` event.

## Staging Book (`staging.staging_books.status`)

See `editorial.md` for the full review-workflow detail. Summary:

```
pending_validation ──▶ needs_review ──▶ approved | merged | rejected
        │
        └──▶ rejected   (hard validation error, before any human review)
```

## Retry strategy (SPEC-04 §23)

Applies at the adapter/fetch level, before a row ever reaches
`staging_books`:

| Failure          | Action        |
|-------------------|---------------|
| Network error      | Retry ×3       |
| Timeout             | Retry          |
| Invalid HTML        | Fail (no retry) |
| Missing ISBN         | Warning only — row still proceeds to `pending_validation` |

## Events

- `ImportStarted` — on `import_runs` row creation (`status=running`).
- `ImportCompleted` — on `import_runs` reaching `completed` or
  `partially_failed`. Schema aligned to the run's own counters:
  `runId`, `publisherId`, `totalBooks`, `newBooks`, `updatedBooks`,
  `rejectedBooks` (see `plan/contracts/events/ImportCompleted.schema.json`).
- `BookImported` — per staging row reaching `pending_validation`.
- `ImportRejected` — per staging row reaching `rejected`.
- `BookPublished` — emitted by Directus when a Book (whether from manual
  creation or an approved staging row) reaches `published`, not by the
  import pipeline itself.
