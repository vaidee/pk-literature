# ADR-008: Work/Book (Edition) Split in the Catalog Schema

## Status

Accepted

## Context

SPEC-02's original model treated `Book` as both the abstract literary
work and the specific printed edition at once, with `edition` as a
plain attribute and a vague self-referential "editions" relationship.
This breaks down for Tamil literature specifically: a work like
Ponniyin Selvan has many printings across decades and publishers, plus
multiple independent English translations. Under the flat model, every
printing/translation is a fully independent row with no shared anchor —
themes, genres, and original-author credit all have to be re-tagged per
edition, and import duplicate-detection has nothing to match against
except fuzzy title/author similarity per row.

## Decision

Split the aggregate root into `works` (abstract literary work — owns
canonical title, original language, summary, and the editorial
relationships that describe *content*: authors, themes, genres, literary
movements) and `books` (a specific purchasable edition/translation/
printing — owns ISBN, edition label, format, language of this printing,
and edition-specific `book_contributors` like translators). A Work has
one or more Books.

A DB trigger enforces the resulting invariant: a Book cannot become
`published` unless its parent Work is `approved` or `published`; a Work
is auto-promoted to `published` the moment its first Book publishes, but
never auto-reverts to `archived`.

## Consequences

+ Themes/genres/movements tagged once, inherited by every translation —
  no drift between an original and its translations.
+ Import duplicate-detection gets a real two-level match target
  (`staging_books.matched_work_id` and `matched_book_id`).
+ "Other editions" / "other translations" is a direct query
  (`books WHERE work_id = ...`), not inferred fuzzy matching.
- More complex than SPEC-02's original flat model; every catalog read
  that shows a book's themes/authors now joins through `works`.
- Deviates from the original SPEC-02 draft; SPEC-02 and SPEC-15 have
  been updated in the same change to reflect this as the current model.

## Related

SPEC-02, SPEC-15, `plan/database/ddl/catalog.sql`,
`plan/state-machines/book.md`.
