# SPEC-04 v2
# Publisher Adapter Framework

Version: 2.0

Status: Approved

Owner:
Platform Architecture

Related Documents

- PRD
- ADR-005 Publisher Import Workflow
- ADR-002 Directus Editorial Workbench
- SPEC-02 Catalog Domain
- SPEC-03 Editorial Workbench

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

                   Publisher

                        │

                Adapter Plugin

                        │

             Normalization Engine

                        │

             Validation Engine

                        │

                Staging Tables

                        │

                 Directus Review

                        │

                  Publish Event

                        │

             Catalog Service

                        │

          Search + Feed Refresh

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

Scheduled Import

↓

Adapter

↓

Discovery

↓

Book Extraction

↓

Normalization

↓

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

Adapter stores

Last Import

↓

Fetch changes only

↓

Compare

↓

Update

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

PublisherScheduled

ManualImport

RetryImport

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

Publisher Worker

Lambda

EventBridge

S3 Bucket

IAM

CloudWatch

Secrets Manager

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
