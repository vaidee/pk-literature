# SPEC-03 --- Editorial Workbench (Directus)

Version: 1.0 Status: Draft

## Purpose

Directus is the Editorial Workbench for the Tamil Literature Platform.
It is the single interface used by editors to curate, enrich, validate
and publish catalog content.

Directus is **not** responsible for commerce, orders or payment
workflows.

------------------------------------------------------------------------

# Objectives

-   Provide a single editorial workspace.
-   Support manual catalog creation.
-   Validate publisher imports.
-   Enrich metadata.
-   Publish reviewed content.
-   Maintain full audit history.

------------------------------------------------------------------------

# Responsibilities

Owns:

-   Books
-   Authors
-   Publishers
-   Themes
-   Genres
-   Collections
-   Editorial Pages
-   Featured Shelves
-   Import Runs
-   Staging Books
-   Editorial Notes
-   Media Assets

Does Not Own:

-   Orders
-   Cart
-   Payments
-   Customers
-   Checkout

------------------------------------------------------------------------

# Collections

## Books

Production catalog.

## Authors

Author master records.

## Publishers

Publisher configuration.

## Themes

## Genres

## Collections

## Literary Movements

## Import Runs

Tracks every publisher synchronization.

Fields:

-   publisher
-   started_at
-   completed_at
-   total_books
-   new_books
-   updated_books
-   rejected_books
-   status

## Staging Books

Temporary records awaiting editorial review.

## Validation Results

Stores duplicate detection and validation issues.

------------------------------------------------------------------------

# Editorial Workflow

Draft

↓

Needs Review

↓

Approved

↓

Published

↓

Archived

Only Published items appear in public APIs.

------------------------------------------------------------------------

# Manual Book Creation

Editors create books directly.

Required:

-   Title
-   Author
-   Publisher

Optional:

-   ISBN
-   Cover
-   Description
-   Themes
-   Genres
-   Collections
-   Inventory
-   Related Books

------------------------------------------------------------------------

# Publisher Review Workflow

Publisher Adapter

↓

Import Run

↓

Staging Book

↓

Validation

↓

Editor Review

↓

Approve / Reject / Merge

↓

Production Catalog

------------------------------------------------------------------------

# Duplicate Detection

Rules:

-   ISBN match
-   Title similarity
-   Author similarity
-   Existing publisher record

Editors decide final action.

------------------------------------------------------------------------

# AI Assisted Enrichment

Future capabilities:

-   Theme suggestion
-   Genre suggestion
-   Summary generation
-   Similar books
-   Reading level
-   Literary movement
-   Cover OCR

Suggestions require editor approval.

------------------------------------------------------------------------

# Roles

## Catalog Editor

Create Edit Review

Cannot delete published books.

## Senior Editor

Publish Archive Merge duplicates

## Administrator

Full access.

------------------------------------------------------------------------

# Permissions

Editors cannot modify commerce schema.

Operations team cannot modify catalog.

------------------------------------------------------------------------

# Media Management

Managed through Directus.

Assets:

-   Covers
-   Publisher logos
-   Promotional banners

Stored in Amazon S3.

------------------------------------------------------------------------

# Audit Trail

Every change records:

-   user
-   timestamp
-   previous value
-   new value
-   reason

------------------------------------------------------------------------

# Directus Flows

Automatic flows:

-   Import validation
-   Cover optimization
-   Notification on approval
-   Trigger catalog publish event
-   Refresh search
-   Refresh feed cache

------------------------------------------------------------------------

# Integrations

Outbound:

-   Catalog Service
-   EventBridge
-   S3

Inbound:

-   Publisher Adapter
-   AI Enrichment Workers

------------------------------------------------------------------------

# Acceptance Criteria

-   Editors can manually create books.
-   Imported books require approval.
-   Duplicate detection assists editors.
-   All changes are auditable.
-   Publishing emits BookPublished events.
-   Commerce data is inaccessible from Directus.
