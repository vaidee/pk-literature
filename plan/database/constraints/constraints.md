# Constraints

Authoritative source is the DDL in `plan/database/ddl/`. Summary of the
non-obvious ones in `catalog`/`staging` (see `naming.md` for the general
conventions — uuid PKs, no hard deletes, status enums):

- `books.isbn13` is nullable (many small-press Tamil books never had an
  ISBN assigned) but unique and format-checked (`^[0-9]{13}$`) when present.
- `books.work_id` and `books.publisher_id` are `ON DELETE RESTRICT` —
  you cannot delete a work/publisher out from under an existing book;
  archive it instead (status-based lifecycle, not deletion).
- `inventory.book_id` is both the primary key and the FK to `books.id`
  (`ON DELETE CASCADE`), enforcing the 1:1 relationship.
- `staging_books` has a `UNIQUE (publisher_id, source_ref)` constraint —
  this is what makes incremental import idempotent (SPEC-04 section 21):
  re-importing the same publisher item updates the existing staging row
  rather than creating a duplicate.
- Junction tables (`work_authors`, `book_contributors`, `work_themes`,
  etc.) use composite primary keys rather than a surrogate `id`, since
  they have no independent identity.
- Money is always `numeric(10,2)` with a separate `char(3)` currency
  column — never float, never an implicit currency.