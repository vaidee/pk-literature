# State Machine — Work & Book

Two coupled lifecycles (`catalog.editorial_status` enum, shared by both
tables): `draft -> needs_review -> approved -> published -> archived`.

## Work

```
draft ──▶ needs_review ──▶ approved ──▶ published ──▶ archived
  ▲____________|(reject)_____|                            |
                                     (explicit editor action only)
```

- `draft -> needs_review`: editor submits for review (or import
  duplicate-detection creates a new Work candidate).
- `needs_review -> approved`: Senior Editor approves the work-level
  metadata (canonical title, authors, themes, genres).
- `needs_review -> draft`: rejected back for revision.
- `approved -> published`: **automatic**, not a manual transition —
  triggered in the DB the moment any child Book is published (see
  `catalog.enforce_book_work_status()` in `catalog.sql`). A Work is
  never published on its own; it's published because it has a
  published edition.
- `published -> archived`: explicit Senior Editor action only. Archiving
  all of a Work's Books does **not** auto-archive the Work — an editor
  must do it deliberately, so a Work doesn't silently disappear from
  admin views just because its editions temporarily went out of print.

## Book

```
draft ──▶ needs_review ──▶ approved ──▶ published ──▶ archived
  ▲____________|(reject)_____|              │
                                              ▼
                                   BLOCKED unless parent Work
                                   status ∈ {approved, published}
```

- Same transitions as Work, plus one hard constraint enforced by a DB
  trigger, not just application logic: **`approved -> published` fails
  if the parent Work is not itself `approved` or `published`.** This
  means work-level editorial review (is this really the right author,
  are the themes right) always happens before or alongside the first
  edition going live — a Book can't jump ahead of its Work.
- Multiple Books under the same Work move through this independently
  once the Work is unblocked — e.g. a 2nd printing can go straight to
  `published` without re-review, while a new translation of the same
  Work goes through its own `draft -> needs_review -> approved` cycle.
- Only `published` Books (and, transitively, their parent Work) are
  visible via the public Catalog API — SPEC-02 acceptance criteria.

## Emitted events

- `Work` reaching `published` (automatically, via first Book): no
  separate `WorkPublished` event — SPEC-02's event list only defines
  `BookPublished`, which carries `workId` (see
  `plan/contracts/events/BookPublished.schema.json`). Consumers that
  care about work-level publication infer it from the first
  `BookPublished` event for a given `workId`.
- `Book` reaching `published`: emits `BookPublished`.
