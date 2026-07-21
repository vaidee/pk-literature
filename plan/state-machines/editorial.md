# State Machine — Editorial Review

Governs how a `staging.staging_books` row (from a publisher import) or a
manually-created Directus draft becomes a live `catalog.works`/
`catalog.books` record. Distinct from — but feeds into — the Work/Book
lifecycle in `book.md`.

## Manual creation (SPEC-02 / SPEC-03)

Editor creates a Work + Book directly in Directus. Follows the Work/Book
state machine in `book.md` from `draft` onward; no staging row involved.

## Publisher import review

```
staging_books.status:
pending_validation ──▶ needs_review ──▶ approved ──▶ (promoted, see below)
        │                    │              │
        ▼                    ▼              ▼
     rejected             rejected        merged
```

- `pending_validation`: row just landed from the adapter; validation
  engine (SPEC-04 §16) has not finished running.
- `pending_validation -> needs_review`: validation passed (errors=0;
  warnings allowed) and duplicate detection has produced a
  `matched_work_id`/`matched_book_id` candidate (or none, meaning "new
  work"). Now waiting on a human.
- `pending_validation -> rejected`: validation produced a hard error
  (duplicate ISBN, invalid currency, broken image — SPEC-04 §16).
  Terminal; the import run counts it under `rejected_books`.
- `needs_review -> approved`: editor confirms this is a new Work/Book
  (no match) or a legitimate new edition of an existing Work — **on
  approval, Directus performs the actual write into `catalog.works`/
  `catalog.books`/`catalog.inventory`**, following the normal Work/Book
  lifecycle from `draft` (new work) or straight to the target status if
  merging into an existing published work.
- `needs_review -> merged`: editor decides this staging row duplicates
  an existing catalog Book and chooses Replace/Merge/Keep-Existing
  (SPEC-04 §19) rather than creating anything new. No new catalog row;
  the matched existing Book/Inventory may be updated instead.
- `needs_review -> rejected`: editor rejects (bad data, unwanted title,
  etc.). Terminal.
- `approved` and `merged` and `rejected` are all terminal for the
  staging row — reprocessing a source item on a later import run
  creates/updates the row via the `UNIQUE (publisher_id, source_ref)`
  constraint rather than reopening a terminal one.

## Roles (SPEC-03)

- **Catalog Editor**: create, edit, review (`pending_validation`/
  `needs_review` decisions up to `approved`/`rejected`/`merged` for new
  content). Cannot publish (cannot move a Book to `published`) or
  archive.
- **Senior Editor**: everything above, plus `approved -> published` on
  Works/Books, `-> archived`, and merge-duplicate resolution.
- **Administrator**: full access.

## Audit

Every transition is recorded by Directus's native revisions/activity
log (user, timestamp, old/new value) — see `spec-03` Audit Trail and the
decision in `spec-15` to rely on Directus rather than a parallel
`audit_log` table, since Directus is the only write path into `catalog`.
