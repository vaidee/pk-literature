-- Up Migration
-- Grants `rds_iam` to search_api_readonly — see api-catalog's
-- 20260101000008_grant_rds_iam.sql for why this is a separate,
-- existence-guarded migration rather than being folded into
-- 20260301000001_search_api_role.sql itself.

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'rds_iam') THEN
    GRANT rds_iam TO search_api_readonly;
  END IF;
END
$$;

-- Down Migration

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'rds_iam') THEN
    REVOKE rds_iam FROM search_api_readonly;
  END IF;
END
$$;
