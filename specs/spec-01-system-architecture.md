# SPEC 01 --- System Architecture

**Version:** 1.0\
**Status:** Draft

## 1. Purpose

This document defines the target system architecture for the Tamil
Literature Platform. The architecture follows a **serverless-first**,
**headless**, and **domain-driven** approach. It separates editorial
content management, public APIs, discovery, and commerce into
independently evolvable domains.

## 2. Guiding Principles

-   Serverless-first for request-driven workloads.
-   Managed AWS services wherever practical.
-   Directus is the editorial workbench only.
-   Medusa manages commerce operations only.
-   PostgreSQL is the single system of record.
-   APIs are the only integration surface for clients.
-   Infrastructure is provisioned using Terraform.

## 3. High-Level Architecture

``` text
Internet
    │
CloudFront
    │
OpenNext (Next.js)
    │
API Gateway
    │
+-------------------------------------------------------+
| Feed | Search | Catalog | Commerce | User | Publisher |
| Lambda Services                                       |
+-------------------------------------------------------+
    │
RDS Proxy
    │
Amazon RDS PostgreSQL
    │
+----------------+-------------------+-------------------+
| Directus       | Medusa            | EventBridge       |
| ECS Express    | Orders Only       | + Lambda Workers  |
+----------------+-------------------+-------------------+
    │
S3 (covers/media)
    │
Razorpay (payments)
```

## 4. Logical Domains

### Catalog

Owns books, authors, publishers, themes, collections, inventory metadata
and the Tamil literature graph.

### Discovery

Feed generation, anonymous likes, recommendations, feature flags and
search.

### Commerce

Cart, checkout, orders, payments, refunds and shipping. Medusa is used
only as the operations back office.

### Editorial

Directus provides editorial workflows, approvals, enrichment and
publishing.

### Publisher Integration

Adapters ingest publisher catalogs into staging before editorial
approval.

## 5. Frontend

-   Next.js
-   OpenNext
-   Responsive (mobile-first)
-   SEO optimized
-   Calls backend APIs only
-   No business logic

## 6. Backend

Stateless Lambda services exposed through API Gateway.

Core APIs:

-   Feed
-   Search
-   Catalog
-   Commerce
-   User
-   Publisher Import

## 7. Database

Amazon RDS PostgreSQL.

Schemas:

-   catalog
-   staging
-   commerce
-   identity
-   analytics (future)

RDS Proxy provides connection pooling.

## 8. Editorial Workbench

Directus (ECS Express):

-   Manual book creation
-   Review publisher imports
-   Approve/reject changes
-   Editorial enrichment
-   Publish to production

## 9. Commerce

Medusa Admin:

-   Orders
-   Payments
-   Customers
-   Shipments
-   Refunds

Does **not** own the book catalog.

Payments use Razorpay. Order state is finalized from Razorpay webhooks.

## 10. Publisher Adapter Pipeline

``` text
Publisher
    ↓
Adapter
    ↓
Normalize
    ↓
Staging Tables
    ↓
Directus Review
    ↓
Approve
    ↓
Production Catalog
    ↓
Feed/Search Refresh
```

Every import is grouped into an Import Run with audit history.

## 11. Background Processing

EventBridge triggers Lambda workers for:

-   Publisher sync
-   Metadata enrichment
-   Notifications
-   Search refresh
-   AI enrichment (future)

## 12. Storage

Amazon S3 stores:

-   Cover images
-   Publisher logos
-   Media assets

Served through CloudFront.

## 13. Security

-   HTTPS everywhere
-   IAM roles for services
-   Secrets Manager
-   Least privilege
-   Directus restricted to editorial users
-   Razorpay webhook signature verification

## 14. Infrastructure as Code

Terraform modules:

-   networking
-   cloudfront
-   opennext
-   api-gateway
-   lambda
-   ecs-express
-   rds
-   rds-proxy
-   s3
-   iam
-   secrets-manager
-   eventbridge
-   cloudwatch

Environment folders:

-   dev
-   qa
-   prod

## 15. Scalability

-   Lambda auto-scales.
-   CloudFront caches aggressively.
-   ECS Express hosts only Directus.
-   PostgreSQL can scale vertically first.
-   Future additions: pgvector, OpenSearch, AI workers.

## 16. Architecture Decisions

-   OpenNext instead of Vercel for AWS-native deployment.
-   Directus owns editorial workflows only.
-   Medusa owns commerce operations only.
-   Publisher imports require editorial approval.
-   PostgreSQL is the canonical data source.

## 17. Acceptance Criteria

-   Frontend deploys through OpenNext.
-   Public APIs are Lambda-based.
-   Directus runs on ECS Express.
-   Medusa manages orders only.
-   Publisher imports never publish directly.
-   Terraform provisions all infrastructure.
