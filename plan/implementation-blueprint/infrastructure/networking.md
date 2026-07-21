# Networking

## VPC layout

One VPC per environment, 2 AZs (dev/qa), 2 AZs to start in prod too
(upgradeable to 3 later — see NAT strategy below). Three subnet tiers,
one of each per AZ:

| Tier                    | Route                          | Hosts |
|--------------------------|----------------------------------|-------|
| `public`                  | Internet Gateway                  | NAT Gateway ENI(s), Directus/Medusa admin ALBs |
| `private-isolated`         | **no route to NAT or IGW**          | RDS PostgreSQL, RDS Proxy, `api-catalog`, `api-feed`, `api-search`, `api-identity` Lambdas |
| `private-nat`               | NAT Gateway                          | `api-publisher-import` Lambda, `api-commerce` Lambda, Directus ECS tasks, Medusa ECS tasks |

`api-gateway` and `cloudfront`/OpenNext are **not** in the VPC at all —
API Gateway (REGIONAL) invokes VPC-attached Lambdas without needing a
VPC Link, since only the Lambda's *own* execution environment needs the
VPC ENI, not the invocation path.

## Why the isolated tier exists

Catalog, Feed, Search, and Identity only ever need to reach RDS Proxy
and a handful of AWS APIs — never the open internet. Putting them in a
subnet with literally no route out (no NAT, no IGW) means a dependency
compromise in one of those functions has no network path to exfiltrate
data or reach the public internet at all, and it's also the highest-
traffic tier (spec-05/spec-08 latency targets), so it avoids NAT's
per-GB data-processing charge on the bulk of request volume. Only
functions that have a genuine reason to leave AWS's network — crawling
publisher websites, calling Razorpay — sit in the NAT tier.

## VPC Endpoints (serving the isolated tier)

- **Gateway endpoint**: S3 (free, no hourly cost) — cover image reads/writes.
- **Interface endpoints**: Secrets Manager, EventBridge, CloudWatch Logs,
  (ECR, if ECS tasks ever move to the isolated tier). Small flat hourly
  cost each, shared across every function in the VPC — cheaper than
  routing that traffic through NAT once you have more than a couple of
  low-volume functions doing it.

## NAT strategy

Single NAT Gateway (not one per AZ) in every environment to start,
including prod — cost-optimized per the PRD's stated infrastructure-cost
metric. Its blast radius is limited by design: an AZ outage taking out
the NAT Gateway degrades only the NAT-tier functions (publisher imports
pause, checkout payment calls fail) while the storefront itself — feed,
search, catalog browsing, cart — keeps working, since those Lambdas
never depended on NAT. Revisit to NAT-per-AZ if that degradation is ever
actually hit in prod.

## Security groups

- `rds-sg`: inbound 5432 from `rds-proxy-sg` only.
- `rds-proxy-sg`: inbound 5432 from `lambda-db-sg` only.
- `lambda-db-sg`: attached to every Lambda needing DB access, regardless
  of which subnet tier it's in.
- `lambda-egress-sg`: attached to NAT-tier Lambdas, outbound 443 only.
- `ecs-directus-sg` / `ecs-medusa-sg`: inbound only from their own ALB's
  security group; no direct public inbound to the ECS tasks themselves.
- `alb-admin-sg`: inbound 443 from the internet (Directus/Medusa admin
  ALBs) — access control is Directus's/Medusa's own auth, with an IP
  allowlist as a future hardening item (see SPEC-13 Security, still a
  stub).

## Public surface

Only CloudFront, API Gateway, and the two admin ALBs are internet-facing.
Nothing else has a public IP.
