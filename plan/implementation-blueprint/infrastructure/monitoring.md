# Monitoring

One CloudWatch dashboard per phase/domain, added by that phase's own
branch (matches Terraform module ownership in `terraform-layout.md`),
plus a platform-wide dashboard from phase-0.

## Platform-wide (phase 0)

- API Gateway: 4xx/5xx rate, p50/p90/p99 latency, per route
- Lambda: errors, throttles, duration, concurrent executions (per function)
- RDS: CPU, connections, RDS Proxy connection pool utilization, replication lag (once Multi-AZ)
- NAT Gateway: bytes out, port allocation errors (early warning for the single-NAT tradeoff in `networking.md`)

## Per-domain (added by each phase)

- Catalog (Phase 1): read API latency
- Publisher Import (Phase 3): import time, books imported/updated/rejected, validation error rate, approval % — the metrics SPEC-04 §24 already specifies
- Discovery Feed (Phase 4): feed API latency (<200ms target, SPEC-05), shelf engagement
- Search (Phase 5): search/autocomplete latency (<250ms/<100ms targets, SPEC-08), zero-result %
- Commerce (Phase 6): checkout completion rate, payment webhook latency, Razorpay error rate

## Alarms (phase 0 baseline, others added per-domain)

- API Gateway 5xx rate > 1% over 5 min
- Lambda error rate > 1% over 5 min, or any function throttling sustained > 1 min
- RDS CPU > 80% over 10 min, RDS Proxy pool exhaustion
- NAT Gateway port allocation errors > 0 (signals the single-NAT choice needs revisiting)

All alarms route to a single SNS topic per environment; on-call/paging
integration is out of scope until the team size justifies it.
