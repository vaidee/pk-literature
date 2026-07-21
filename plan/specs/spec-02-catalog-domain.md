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

## Book

Core entity representing a published work.

Key attributes:

-   id
-   isbn13
-   title
-   subtitle
-   language
-   edition
-   publication_date
-   format
-   page_count
-   status

Relationships:

-   authors
-   publisher
-   themes
-   genres
-   collections
-   inventory
-   editions

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
2.  A book can have multiple authors.
3.  A book can belong to multiple collections.
4.  Inventory updates never overwrite editorial metadata.
5.  Publisher imports cannot publish directly.
6.  Every change is auditable.

------------------------------------------------------------------------

# Future Extensions

-   Multiple editions
-   Translations
-   Audiobooks
-   eBooks
-   Tamil Literature Graph
-   AI generated summaries
-   Semantic embeddings

------------------------------------------------------------------------

# Acceptance Criteria

-   Catalog is the system of record.
-   Books are independently addressable.
-   Editorial approval required for publication.
-   APIs expose only Published books.
-   Commerce references books by ID only.
-   Directus is the editorial interface.
