# SPEC-10 --- Platform Architecture

-   AWS-first, serverless-first architecture.
-   Components: OpenNext, CloudFront, API Gateway, Lambda, RDS
    PostgreSQL, RDS Proxy, ECS Express (Directus), Medusa, S3,
    EventBridge, CloudWatch.
-   Service boundaries by domain.
-   Event-driven integrations.
-   Multi-environment: dev/qa/prod.
-   Scalability: Lambda autoscaling, CloudFront caching, ECS only for
    long-running services.
-   Acceptance: independently deployable frontend/backend; zero shared
    business logic.
