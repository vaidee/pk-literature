# SPEC-02 --- Catalog Domain

Version: 1.0 Status: Draft

## Purpose

The Catalog Domain is the canonical representation of Tamil literature
on the platform. It owns bibliographic metadata, editorial enrichments,
publisher relationships, inventory metadata, and future knowledge graph
relationships.

The catalog **does not** own orders, payments, carts, or customer
information.

------------------------------------------------------------------------

# Objectives

-   Single source of truth for all books.
-   Support multiple publishers.
-   Support editorial enrichment.
-   Enable discovery and recommendations.
-   Decouple catalog from commerce.
-   Support AI-assisted metadata enrichment.

------------------------------------------------------------------------

# Domain Ownership

Owns:

-   Books
-   Authors
-   Publishers
-   Series
-   Editions
-   Themes
-   Genres
-   Literary Movements
-   Collections
-   Inventory metadata
-   Knowledge graph relationships

Does Not Own:

-   Orders
-   Cart
-   Payments
-   Customers
-   Shipments

------------------------------------------------------------------------

# Aggregate Roots

> **Schema note (v2, see SPEC-15):** the data model below has been
> superseded by a Work/Book split. `Book` here becomes a specific
> purchasable **edition** (isbn13-bearing, one row per printing/
> translation); a new `Work` aggregate root represents the abstract
> literary work and owns the original author(s), themes, genres, and
> literary movement relationships (they describe the content, so a
> translation inherits them automatically instead of being re-tagged).
> `Book.editions` (a self-referential list) is replaced by `Work → many
> Books`. See `plan/specs/spec-15-data-model.md` and
> `plan/database/ddl/catalog.sql` for the authoritative shape.

## Work

Abstract literary work, independent of language or printing.

Key attributes:

-   id
-   canonical_title
-   original_language
-   work_type
-   summary
-   status

Relationships:

-   authors (original author(s))
-   themes
-   genres
-   literary_movements
-   books (one or more editions/translations)

## Book

A specific purchasable edition, translation, or printing of a Work.

Key attributes:

-   id
-   work_id
-   isbn13
-   title
-   subtitle
-   language
-   edition_label
-   publication_date
-   format
-   page_count
-   status

Relationships:

-   work
-   contributors (translator/illustrator/editor of this edition)
-   publisher
-   collections
-   inventory

------------------------------------------------------------------------

## Author

Attributes:

-   name
-   biography
-   birth_year
-   death_year
-   aliases
-   photo

------------------------------------------------------------------------

## Publisher

Attributes:

-   name
-   website
-   country
-   adapter_type
-   active

------------------------------------------------------------------------

## Collection

Editorial grouping such as:

-   Editor's Picks
-   New Arrivals
-   Sangam Literature
-   Modern Fiction

------------------------------------------------------------------------

## Theme

Examples:

-   Feminism
-   Spirituality
-   Politics
-   Rural Life
-   History

------------------------------------------------------------------------

# Inventory

Catalog stores latest inventory metadata.

Fields:

-   book_id
-   publisher_id
-   sku
-   stock
-   price
-   currency
-   availability
-   last_sync_time

Inventory is updated by publisher adapters and may be manually corrected
by editors.

------------------------------------------------------------------------

# Lifecycle

Draft

↓

Needs Review

↓

Approved

↓

Published

↓

Archived

Only Published books are visible publicly.

------------------------------------------------------------------------

# Manual Creation

Editors may create books manually using Directus.

Required:

-   title
-   author
-   publisher

Optional:

-   ISBN
-   cover
-   themes
-   summary
-   inventory

------------------------------------------------------------------------

# Publisher Import

Publisher adapters write to staging.

Editorial approval is required before data reaches the catalog.

Import sources:

-   Website crawler
-   CSV
-   JSON
-   API

------------------------------------------------------------------------

# API Surface

The Catalog API is **read-only**. All writes to the `catalog` schema
happen directly from Directus (manual creation/editing, and promoting
an approved staging row) — see SPEC-03. The Catalog Lambda service
never accepts a write; this is deliberate, not an omission, since every
write must pass through the editorial approval gate one way or another.

GET /works

GET /works/{id}

GET /books

GET /books/{id}

GET /authors

GET /publishers

GET /collections

GET /themes

GET /genres

------------------------------------------------------------------------

# Search Fields

Indexed:

-   title
-   subtitle
-   isbn
-   author
-   publisher
-   themes
-   tags

Uses PostgreSQL Full Text Search.

------------------------------------------------------------------------

# Events

Published:

-   BookCreated
-   BookUpdated
-   BookPublished
-   InventoryUpdated
-   PublisherUpdated

Consumed:

-   ImportApproved
-   MetadataEnriched
-   CoverUploaded

------------------------------------------------------------------------

# Business Rules

1.  Every book belongs to exactly one publisher.
2.  A work can have multiple authors; a book can have multiple edition-specific contributors (translator, illustrator, editor).
3.  A book can belong to multiple collections.
4.  Inventory updates never overwrite editorial metadata (enforced by keeping inventory a separate table).
5.  Publisher imports cannot publish directly.
6.  Every change is auditable.
7.  A translation shares its work's themes/genres/literary movements unless an editor overrides them at the work level; themes are not re-tagged per edition.

------------------------------------------------------------------------

# Future Extensions

-   Audiobooks
-   eBooks
-   Tamil Literature Graph
-   AI generated summaries
-   Semantic embeddings

(Multiple editions and translations are no longer "future" — see the Work/Book model above, implemented as of SPEC-15 v2.)

------------------------------------------------------------------------

# Acceptance Criteria

-   Catalog is the system of record.
-   Books are independently addressable.
-   Editorial approval required for publication.
-   APIs expose only Published books.
-   Commerce references books by ID only.
-   Directus is the editorial interface.
