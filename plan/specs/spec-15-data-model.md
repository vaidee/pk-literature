# SPEC-15 --- Data Model

Version: 2.0
Status: Draft

Schemas: `catalog`, `staging` (defined below — implemented in
`plan/database/ddl/catalog.sql` and `staging.sql`), `commerce`,
`identity` (Phase 6/7 — not yet designed).

The DDL files are the source of truth for column-level detail; this
document explains the shape and the reasoning, and should be updated
whenever the DDL changes.

---

## Catalog schema: Work/Edition model

Supersedes the flat "edition is just a field on Book" model in early
drafts of SPEC-02. `works` is the abstract literary work
(language-independent); `books` is a specific purchasable
edition/translation/printing of a work, and is what carries the ISBN,
price, and inventory.

```
works (abstract literary work)
  │  canonical_title, original_language, work_type, summary, status
  │
  ├─ work_authors (M:N → authors)         original author(s)
  ├─ work_themes (M:N → themes)
  ├─ work_genres (M:N → genres)
  └─ work_literary_movements (M:N → literary_movements)
       │
       ▼
     books (1 work → N books: editions, translations, reprints)
       │  isbn13, title, language, edition_label, format, status
       │  translated_from_book_id → books.id (nullable self-ref)
       │
       ├─ book_contributors (M:N → authors)   translator/illustrator/editor of THIS edition
       ├─ book_collections (M:N → collections) editorial shelves
       └─ inventory (1:1)                      sku, stock, price, currency, availability
```

Why themes/genres/movements attach to `works` and not `books`: they
describe the content, which is shared by every translation and
reprint. A translated edition should not need separate theme tagging
from its original. Collections attach to `books` instead, since shelves
like "New Arrivals" are inherently about a specific purchasable printing
becoming available, not the abstract work.

Why `inventory` is a separate 1:1 table rather than columns on `books`:
SPEC-02's business rule "inventory updates never overwrite editorial
metadata" is enforced structurally this way — the publisher-adapter
inventory-sync path only ever has a reason to touch `inventory`, never
`books`.

### Core entities

Work, Book, Author, Publisher, Theme, Genre, LiteraryMovement,
Collection, Inventory, MediaAsset (S3-backed covers/logos).

### Key relationships

- Work → Book: 1:N (a work has one or more editions/translations)
- Work → Author: M:N via `work_authors` (role: author/co_author/compiler)
- Book → Author: M:N via `book_contributors` (role: translator/illustrator/editor/foreword)
- Work → Theme / Genre / LiteraryMovement: M:N
- Book → Publisher: N:1 (every book belongs to exactly one publisher — SPEC-02 business rule)
- Book → Collection: M:N via `book_collections`
- Book → Inventory: 1:1
- Book → Book (`translated_from_book_id`): optional self-reference, set only when a
  translation's specific source edition is known

## Staging schema

Mirrors the shape of `staging_books` against the eventual `catalog`
target, but stays loosely typed (extracted fields nullable, plus a
`raw_payload jsonb` for full provenance/replay). See
`plan/database/ddl/staging.sql`.

`import_runs` → `staging_books` → (`staging_inventory`,
`staging_media`, `staging_validation`, `staging_relationships`).
`staging_books.matched_work_id` / `matched_book_id` hold the duplicate-
detection outcome; nothing here is visible to public APIs, and nothing
here writes to `catalog` except through editorial approval in Directus.

## Commerce / Identity schemas

Not yet designed — deferred to Phase 6 (Commerce) and Phase 7
(Identity). SPEC-06 and SPEC-07 describe the intended table list
(`cart`, `orders`, `payments`, `users`, `addresses`, etc.); DDL will be
written when those phases start, following the same Work/Book
referencing pattern (`order_items.book_id → catalog.books.id`, snapshot
fields for title/price at time of purchase, never a live join into
catalog).

## Acceptance

- Migrations are version-controlled (see `migrations.md`).
- Every schema change to `catalog`/`staging` updates this document and
  the corresponding DDL file in the same PR.
