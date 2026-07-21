# SPEC-04 v2
# Publisher Adapter Framework

Version: 2.1

Status: Approved

Owner:
Platform Architecture

Related Documents

- PRD
- ADR-005 Publisher Import Workflow
- ADR-002 Directus Editorial Workbench
- ADR-009 Externalized Adapter Execution
- SPEC-02 Catalog Domain
- SPEC-03 Editorial Workbench

> **Execution model note (v2.1, see ADR-009):** the adapter's
> discover/fetch/normalize steps run **outside AWS**, as a scheduled
> GitHub Actions workflow, not as an AWS Lambda triggered by EventBridge.
> Only the validation/duplicate-detection/staging-write steps — the ones
> that need database access — run inside AWS, as a Lambda sitting behind
> a small IAM-authenticated "staging-ingest" API route. This removes the
> adapter's need for a NAT Gateway entirely (see
> `infrastructure/networking.md`) without changing anything about the
> staging schema, the editorial review workflow, or the Adapter SDK
> interface below — `discover()`/`fetchBooks()`/etc. still run, just on
> a GitHub Actions runner instead of inside the VPC.

---

# 1. Purpose

This document specifies the architecture, interfaces, workflows,
contracts and operational requirements for importing publisher
catalogs into the Tamil Literature Platform.

The framework allows new publishers to be onboarded without
changing the core platform.

Publisher adapters are plugins.

The Catalog remains the system of record.

Directus remains the editorial approval interface.

---

# 2. Goals

The framework shall

✓ Import books

✓ Import inventory

✓ Import pricing

✓ Import media

✓ Normalize metadata

✓ Detect duplicates

✓ Support manual approval

✓ Maintain audit history

✓ Support incremental imports

✓ Support retry

✓ Be horizontally scalable

---

# 3. Non Goals

Publisher adapters SHALL NOT

Publish directly

Modify production catalog

Delete books

Modify editorial metadata

Modify commerce

---

# 4. Architecture

```
────────────── outside AWS (GitHub Actions runner) ──────────────
                   Publisher
                        │
                Adapter Plugin
                        │
             Normalization Engine
                        │
              (POST fetched + normalized books, IAM SigV4 auth)
────────────────────────┼──────────── AWS VPC, private-isolated ──
                        ▼
             Validation Engine   (staging-ingest Lambda)
                        │
                Staging Tables
────────────────────────┼──────────────────────────────────────────
                        ▼
                 Directus Review
                        │
                  Publish Event
                        │
             Catalog Service
                        │
          Search + Feed Refresh
```

The boundary matters: everything above the line can reach arbitrary
publisher websites/APIs but never touches the database directly;
everything below the line can reach the database but never leaves AWS's
network. See ADR-009.

---

# 5. High Level Components

Publisher Adapter

Normalization Service

Validation Service

Duplicate Detection

Media Downloader

Inventory Synchronizer

Editorial Approval

Publishing Pipeline

---

# 6. Adapter SDK

Every adapter implements

```typescript
interface PublisherAdapter {

    discover()

    fetchBooks()

    fetchBook()

    fetchInventory()

    downloadCover()

    normalize()

    validate()

}
```

---

# 7. Adapter Types

### HTML

Example

Kalachuvadu

Crawler based

---

### REST

Publisher exposes APIs

---

### GraphQL

Preferred

---

### CSV

Scheduled uploads

---

### JSON Feed

Recommended

---

# 8. Publisher Registration

Publisher

Name

Code

Base URL

Authentication

Adapter Type

Polling Frequency

Inventory Strategy

Cover Strategy

Enabled

---

# 9. Import Lifecycle

Scheduled Import (GitHub Actions cron, or manual `workflow_dispatch`)

↓

Adapter — fetch `last_import_cursor` from `catalog.publishers` via the
staging-ingest API's read route, then run

↓

Discovery

↓

Book Extraction

↓

Normalization

↓ ═══ AWS boundary — POST to staging-ingest API (IAM SigV4 auth) ═══

Validation

↓

Staging

↓

Editor Review

↓

Publish

↓

Catalog Updated

↓

Search Refresh

↓

Feed Refresh

---

# 10. Discovery

Discovery determines

Available pages

Pagination

Books

Categories

Collections

New releases

---

# 11. Pagination

Must support

?page=

offset

cursor

next links

infinite scroll

---

# 12. Metadata Extraction

Minimum

ISBN

Title

Subtitle

Author

Publisher

Description

Language

Cover

Price

Currency

Stock

Category

Publication Date

Edition

Pages

---

# 13. Cover Download

Original image

↓

Download

↓

Virus Scan

↓

Optimize

↓

Thumbnail

↓

Upload S3

↓

Store Metadata

---

# 14. Normalization

Publisher specific

↓

Canonical Model

Example

Author Name

"ஜெயமோகன்"

↓

Canonical

Jeyamohan

Alias stored.

---

# 15. Duplicate Detection

Rules

ISBN

↓

Exact

Title

↓

Fuzzy

Author

↓

Similarity

Cover

↓

Hash

AI Similarity

↓

Optional

---

# 16. Validation Rules

Required

Title

Author

Publisher

Price

Language

Cover

Warnings

Small Cover

Missing ISBN

Missing Description

Errors

Duplicate ISBN

Invalid Currency

Broken Image

---

# 17. Staging Schema

staging_books

staging_inventory

staging_media

staging_validation

staging_relationships

---

# 18. Editorial Workflow

Imported

↓

Needs Review

↓

Approved

↓

Published

Rejected

Merged

Archived

---

# 19. Merge Rules

Editors may

Replace

Merge

Keep Existing

Reject

---

# 20. Inventory

Inventory imports update

Stock

Price

Availability

Last Updated

Inventory NEVER updates

Description

Summary

Themes

Editorial Tags

---

# 21. Incremental Import

`catalog.publishers.last_import_cursor` / `last_import_at` store the
watermark (opaque, adapter-defined format — last page token, timestamp,
or source id, whatever that publisher's pagination needs). The external
runner:

Read cursor (staging-ingest API GET route)

↓

Fetch changes only

↓

Compare

↓

POST to staging-ingest API

↓

Write cursor back (on successful run completion only — a failed/partial
run does not advance the watermark, so the next run retries the same
window)

---

# 22. Events

Produces

ImportStarted

ImportCompleted

BookImported

InventoryUpdated

ImportRejected

BookPublished

Consumes

None — scheduling is no longer event-driven from inside AWS. The
GitHub Actions workflow's own cron/`workflow_dispatch` trigger replaces
`PublisherScheduled`/`ManualImport`/`RetryImport`; retries are handled
by the workflow's own retry logic (§23) before it ever calls the
staging-ingest API, not by an internal AWS retry event.

---

# 23. Retry Strategy

Network Error

Retry 3

Timeout

Retry

Invalid HTML

Fail

Missing ISBN

Warning

---

# 24. Observability

Metrics

Import Time

Books Imported

Books Updated

Duplicates

Validation Errors

Approval %

Failures

CloudWatch Dashboard

---

# 25. Security

Secrets Manager

IAM Role

TLS

Rate Limiting

robots.txt compliance

Publisher Allow List

---

# 26. Performance

1000 Books

< 2 minutes

10000 Books

< 15 minutes

Incremental

< 30 seconds

---

# 27. Reference Adapter

Kalachuvadu

Implements

Pagination

Metadata

Images

Pricing

Inventory

Normalization

Editorial Approval

---

# 28. Terraform

Staging-Ingest API (API Gateway route + Lambda, private-isolated
subnet — no NAT, no scheduled EventBridge rule; this Lambda is purely
inbound, see ADR-009)

EventBridge (still used for `ImportCompleted`/`BookImported`/etc.
outbound events — just no longer used to *trigger* the adapter)

S3 Bucket

IAM (`lambda-api-publisher-import` execution role + `gha-publisher-import-<env>`
OIDC role for the external runner — see `infrastructure/iam.md`)

CloudWatch

Secrets Manager (Razorpay/Directus/Medusa secrets only — per-publisher
adapter credentials now live in GitHub Actions secrets, not here, since
the runner has no AWS Secrets Manager access; see
`infrastructure/secrets.md`)

---

# 29. Acceptance Tests

✓ Import succeeds

✓ Inventory updates

✓ Duplicate detected

✓ Editor approves

✓ Book published

✓ Search updated

✓ Feed updated

---

# 30. Future

Publisher Push API

Realtime Inventory

AI Metadata

OCR

Audio Books

E-books

Graph Relationships

Publisher Self Service Portal

---

# Appendix A

Canonical Book Model

(Book JSON)

---

# Appendix B

Import Event JSON

---

# Appendix C

Adapter SDK

Complete TypeScript Interfaces

---

# Appendix D

Kalachuvadu Adapter Walkthrough

End-to-end implementation example.
