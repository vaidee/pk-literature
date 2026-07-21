# ADR-007: Serverless-first Platform

## Status

Accepted \## Context Traffic will start small and grow gradually. \##
Decision Prefer Lambda, API Gateway, EventBridge and managed AWS
services. Run only Directus as a long-lived ECS Express service. \##
Consequences + Pay-per-use + Low operational overhead + High
scalability - Cold starts for infrequent APIs
