# SPEC-14 --- Observability

Version: 1.1

CloudWatch Logs, Metrics, Alarms. X-Ray distributed tracing deferred —
not adopted until the request path actually spans enough services
(Lambda → RDS Proxy → Postgres today is simple enough to debug from
logs alone; tracing earns its cost once Feed/Search start calling other
internal services, not before).

Full dashboard/alarm inventory: `infrastructure/monitoring.md` — this
spec is the acceptance-level summary, that doc is the source of truth
for what's actually configured.

## Structured logging

Every service logs structured JSON (not plain text) to CloudWatch Logs,
with a consistent minimum field set: `timestamp`, `service`,
`requestId`, `level`. Request IDs propagate from API Gateway through to
any DB query logged at debug level, so a single request's full path is
greppable by one ID even without distributed tracing.

## Business metrics (per-domain, added by that phase's branch)

- Feed: CTR, likes per session, shelf engagement, discovery-to-purchase
  conversion (SPEC-05).
- Search: zero-result %, top queries, CTR (SPEC-08 §28).
- Publisher Import: import time, books imported/updated/rejected,
  approval % (SPEC-04 §24).
- Commerce: checkout completion rate, cart abandonment.

No PII in any metric or log line by default (SPEC-08 §20 already states
this for search analytics — applies platform-wide: anonymous UUIDs and
aggregate counts only, never email/phone/address in a log line).

## Operational metrics

Lambda errors/throttles/duration per function, RDS CPU/connections/RDS
Proxy pool utilization, ECS task health, NAT Gateway port allocation
errors (early warning specific to the single-NAT decision in
`infrastructure/networking.md`) — full list and alarm thresholds in
`infrastructure/monitoring.md`.

## Acceptance

- Every phase's own CloudWatch dashboard exists before that phase
  merges to `main` (not retrofitted later).
- Every alarm in `infrastructure/monitoring.md` routes to the
  environment's SNS topic.
- No log line contains PII or a secret value.
