-- Up Migration
-- Least-privilege DB role for the Catalog Lambda (infrastructure/iam.md:
-- "Catalog API's role is read-only end to end, DB grant, not just IAM
-- policy"). This role is what the Lambda's RDS Proxy IAM auth token
-- authenticates as.
--
-- NOT done here, must be run manually against the real deployed RDS
-- instance after this migration: `GRANT rds_iam TO catalog_api_readonly;`
-- — the `rds_iam` role only exists on actual RDS instances, not vanilla
-- Postgres, so it can't be part of a migration that also needs to run
-- cleanly against a local/CI throwaway Postgres (development/testing.md).
-- Track this as a deploy-time step in runbooks/deploy.md's per-phase
-- checklist, not something to forget silently.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'catalog_api_readonly') THEN
    CREATE ROLE catalog_api_readonly WITH LOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA catalog TO catalog_api_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA catalog TO catalog_api_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA catalog GRANT SELECT ON TABLES TO catalog_api_readonly;

-- Down Migration

ALTER DEFAULT PRIVILEGES IN SCHEMA catalog REVOKE SELECT ON TABLES FROM catalog_api_readonly;
REVOKE SELECT ON ALL TABLES IN SCHEMA catalog FROM catalog_api_readonly;
REVOKE USAGE ON SCHEMA catalog FROM catalog_api_readonly;
DROP ROLE IF EXISTS catalog_api_readonly;
