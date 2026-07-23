-- Up Migration
-- DB role for the Identity Lambda (infrastructure/iam.md:
-- "lambda-api-identity: RDS Proxy connect (read/write identity schema);
-- CloudWatch Logs write"). IAM auth via RDS Proxy, same pattern as
-- every other *_rw role so far. No grants on any other schema —
-- api-identity never reads/writes catalog, commerce, or discovery
-- directly (coding-guidelines.md's service-boundary rule extends to
-- the DB layer, not just imports); the anonymous-cart merge happens by
-- publishing an event apps/api-commerce consumes, not by this role
-- touching commerce tables.
--
-- NOT done here, must be run manually against the real deployed RDS
-- instance after this migration, same as prior role migrations:
-- `GRANT rds_iam TO identity_api_rw;` — `rds_iam` only exists on real
-- RDS instances. See runbooks/deploy.md.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'identity_api_rw') THEN
    CREATE ROLE identity_api_rw WITH LOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA identity TO identity_api_rw;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA identity TO identity_api_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA identity GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO identity_api_rw;

-- Down Migration

ALTER DEFAULT PRIVILEGES IN SCHEMA identity REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM identity_api_rw;
REVOKE SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA identity FROM identity_api_rw;
REVOKE USAGE ON SCHEMA identity FROM identity_api_rw;
DROP ROLE IF EXISTS identity_api_rw;
