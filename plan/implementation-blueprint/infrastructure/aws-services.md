# AWS Services

| Service | Purpose | Provisioned by phase |
|---------|---------|------------------------|
| CloudFront | CDN for OpenNext frontend, cover images, autocomplete/search caching | 0 |
| API Gateway (REGIONAL) | Public entry point for all Lambda APIs | 0 (shell), each phase adds routes |
| Lambda | Catalog/Feed/Search/Commerce/Identity/Publisher-Import services | per-domain phase |
| RDS PostgreSQL | System of record, all schemas | 0 |
| RDS Proxy | Connection pooling for Lambda's high connection churn | 0 |
| ECS (Express/Fargate) | Directus (2), Medusa (6) — the only long-running containers | 2, 6 |
| S3 | Cover images, publisher logos, media, Terraform state | 0 |
| EventBridge | Async domain events (BookPublished, OrderCreated, ImportCompleted, ...) | 0 (bus), each phase adds rules |
| Secrets Manager | All credentials/API keys (see `secrets.md`) | 0 |
| CloudWatch | Logs, metrics, dashboards, alarms | 0 (base), each phase adds its own dashboard |
| VPC Endpoints | S3 (gateway), Secrets Manager/EventBridge/CloudWatch Logs (interface) | 0 |
| NAT Gateway | Egress for publisher-import + commerce Lambdas, Directus/Medusa ECS | 0 |
| Route 53 | DNS for the public domain and Directus/Medusa admin subdomains | 0 |
| ACM | TLS certificates for CloudFront, API Gateway, admin ALBs | 0 |

Explicitly **not** used (per SPEC-01/PRD "managed services, serverless-
first" and non-goals): self-managed Kubernetes, EC2 for application
compute (ECS/Fargate only, and only for Directus/Medusa), self-hosted
search engine (Postgres FTS/pg_trgm for now — OpenSearch is a listed
future option, not adopted yet).
