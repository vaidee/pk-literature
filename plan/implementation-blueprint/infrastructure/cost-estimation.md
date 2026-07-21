# Cost Estimation

Rough monthly order-of-magnitude, pre-launch/low-traffic assumptions.
Revisit once real traffic numbers exist — this is a planning estimate,
not a budget commitment.

| Item | Dev | QA | Prod (early) |
|------|-----|----|--------------|
| RDS PostgreSQL (single instance, no Multi-AZ yet) | ~$15 (t4g.micro) | ~$15 | ~$60 (t4g.medium) |
| RDS Proxy | ~$15 | ~$15 | ~$15 |
| NAT Gateway (single, per `networking.md`) | ~$35 | ~$35 | ~$35 |
| VPC Interface Endpoints (×3) | ~$22 | ~$22 | ~$22 |
| Lambda (request-based, low volume pre-launch) | <$5 | <$5 | ~$10-30 |
| ECS Fargate — Directus (1 task, small) | ~$15 | ~$15 | ~$30 (2 tasks for availability) |
| ECS Fargate — Medusa (1 task, small) | ~$15 | ~$15 | ~$30 |
| S3 + CloudFront | <$5 | <$5 | ~$10-20 |
| Secrets Manager | ~$5 | ~$5 | ~$5 |
| CloudWatch | <$5 | <$5 | ~$10 |
| **Rough total** | **~$130/mo** | **~$130/mo** | **~$230-280/mo** |

RDS Multi-AZ, NAT-per-AZ, and additional Fargate task count for HA are
all deferred until traffic/uptime requirements justify them (see
`networking.md` NAT strategy discussion) — this estimate is for a
pre-launch/early-traffic posture, not steady-state production at scale.

## Teardown as a cost lever

The biggest lever isn't removing a single component — it's that `dev`
and `qa` don't need to run continuously at all. The bootstrap/
environment split (`terraform-layout.md`) makes full teardown-and-rebuild
routine and safe (`runbooks/teardown.md`): tearing down `dev` overnight
or `qa` between test cycles removes effectively the entire ~$130/mo
run-rate for however long it's down — RDS, RDS Proxy, NAT Gateway, VPC
endpoints, and ECS Fargate tasks are all environment-layer resources
that go away with it, while the state/OIDC/ECR bootstrap layer (a few
dollars/month at most — S3 + DynamoDB + nothing else billable) keeps
running so the environment rebuilds cleanly via CI whenever it's needed
again. This is a bigger and more flexible saving than any single
component swap, and doesn't trade away NAT's security posture the way
removing it outright would.
