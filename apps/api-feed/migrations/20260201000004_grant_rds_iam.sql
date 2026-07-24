-- Up Migration
-- Grants `rds_iam` to feed_api_rw — see api-catalog's
-- 20260101000008_grant_rds_iam.sql for why this is a separate,
-- existence-guarded migration rather than being folded into
-- 20260201000002_feed_api_role.sql itself.

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'rds_iam') THEN
    GRANT rds_iam TO feed_api_rw;
  END IF;
END
$$;

-- Down Migration

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'rds_iam') THEN
    REVOKE rds_iam FROM feed_api_rw;
  END IF;
END
$$;
