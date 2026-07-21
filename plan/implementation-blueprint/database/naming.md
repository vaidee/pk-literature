# Naming Conventions

- Schemas: singular, lowercase — `catalog`, `staging`, `commerce`, `identity`.
- Tables: plural, snake_case — `books`, `work_authors`.
- Junction/M:N tables: `<left_plural>_<right_plural>` in alphabetical-ish
  dependency order, e.g. `work_authors`, `book_themes`, `book_collections`.
- Primary key column: always `id`, type `uuid`, default `gen_random_uuid()`
  (pgcrypto/pgcrypto-free via `gen_random_uuid()` on PG13+).
- Foreign key column: `<referenced_table_singular>_id`, e.g. `work_id`,
  `publisher_id`. Self-referencing FKs get a descriptive prefix, e.g.
  `translated_from_book_id`.
- Timestamps: `created_at`, `updated_at`, both `timestamptz`, both
  `not null default now()`. `updated_at` maintained by a trigger, not
  application code, so it's correct regardless of write path
  (Directus, migration script, or future service).
- Enums: implemented as Postgres `enum` types named `<table>_<column>_enum`
  where the value set is small and stable (status/lifecycle fields);
  otherwise a lookup table with an `id`/`code`/`label` (e.g. `genres`,
  `themes` are lookup tables, not enums, since editors add new ones).
- No hard deletes on editorially-managed content (works, books, authors,
  publishers). Lifecycle is modeled with a `status` column; `archived` is
  a status, not a delete.
- All money as `numeric(10,2)`, currency as a separate `char(3)` ISO 4217
  column — never float.
