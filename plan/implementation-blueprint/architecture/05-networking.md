# Networking

VPC per environment, 3 subnet tiers: `public` (NAT + admin ALBs only),
`private-isolated` (no internet route at all — RDS, RDS Proxy, and the
read-heavy Catalog/Feed/Search/Identity Lambdas), `private-nat`
(publisher-import and Commerce Lambdas, Directus/Medusa ECS — the only
things that need to reach the public internet). CloudFront and API
Gateway are public entry points but are not themselves inside the VPC.
Security groups are least-privilege and chain
`rds-sg ← rds-proxy-sg ← lambda-db-sg`.

Full design, CIDR/subnet detail, VPC endpoint list, and NAT cost
tradeoff: `infrastructure/networking.md`.