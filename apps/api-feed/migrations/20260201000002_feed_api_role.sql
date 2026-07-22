-- Up Migration
-- DB role for the Feed Lambda (infrastructure/iam.md: "lambda-api-feed:
-- RDS Proxy connect (read/write to a future discovery schema —
-- interest_profile/interest_event; read-only on catalog)"). IAM auth
-- via RDS Proxy, same pattern as catalog_api_readonly/
-- publisher_import_writer.
--
-- NOT done here, must be run manually against the real deployed RDS
-- instance after this migration, same as prior role migrations:
-- `GRANT rds_iam TO feed_api_rw;` — `rds_iam` only exists on real RDS
-- instances. See runbooks/deploy.md.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'feed_api_rw') THEN
    CREATE ROLE feed_api_rw WITH LOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA discovery TO feed_api_rw;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA discovery TO feed_api_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA discovery GRANT SELECT, INSERT, UPDATE ON TABLES TO feed_api_rw;

-- Read-only on catalog: shelf rendering joins books/works/authors/
-- publishers/collections; the personalized "Similar to Books You
-- Liked" shelf (feature-flagged) also reads themes/genres via those
-- join tables. Feed never writes catalog (SPEC-05 has no catalog
-- mutation in its API surface at all).
GRANT USAGE ON SCHEMA catalog TO feed_api_rw;
GRANT SELECT ON ALL TABLES IN SCHEMA catalog TO feed_api_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA catalog GRANT SELECT ON TABLES TO feed_api_rw;

-- Down Migration

ALTER DEFAULT PRIVILEGES IN SCHEMA catalog REVOKE SELECT ON TABLES FROM feed_api_rw;
REVOKE SELECT ON ALL TABLES IN SCHEMA catalog FROM feed_api_rw;
REVOKE USAGE ON SCHEMA catalog FROM feed_api_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA discovery REVOKE SELECT, INSERT, UPDATE ON TABLES FROM feed_api_rw;
REVOKE SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA discovery FROM feed_api_rw;
REVOKE USAGE ON SCHEMA discovery FROM feed_api_rw;
DROP ROLE IF EXISTS feed_api_rw;
