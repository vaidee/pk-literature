# Index Strategy

Authoritative source is `plan/database/ddl/catalog.sql`. Rationale:

- `books.search_vector` (tsvector, weighted A=title, A=isbn, B=subtitle)
  with a `GIN` index — this is what `GET /search` (SPEC-08) queries
  against. Maintained by trigger on insert/update, not computed at query
  time.
- `pg_trgm` `GIN` indexes on `books.title` and `authors.canonical_name`
  for fuzzy/typo-tolerant matching (SPEC-08 similarity threshold 0.35) —
  covers cases like "jayamohan" → Jeyamohan.
- Partial indexes on `books.status`/`works.status` filtered to
  `= 'published'` — the vast majority of reads (every public API call)
  only ever want published rows, so a partial index keeps it small and
  fast as staging/draft rows accumulate.
- Plain B-tree on every FK used in a join the API actually performs
  (`books.work_id`, `books.publisher_id`, `staging_books.import_run_id`,
  etc.) — Postgres does not auto-index FK columns.
- Deliberately no index yet on `themes`/`genres` lookup tables — small,
  full-scan is fine until proven otherwise.