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

The single-NAT-Gateway decision (`networking.md`) is the single biggest
lever available if cost needs to drop further — removing it entirely for
dev/qa (accepting that publisher-import/commerce testing there requires
a temporary workaround) would save ~$35/mo per environment. Not
recommended to start; revisit only if cost pressure is real.

RDS Multi-AZ, NAT-per-AZ, and additional Fargate task count for HA are
all deferred until traffic/uptime requirements justify them (see
`networking.md` NAT strategy discussion) — this estimate is for a
pre-launch/early-traffic posture, not steady-state production at scale.
