-- Up Migration
-- Grants `rds_iam` to commerce_api_rw — see api-catalog's
-- 20260101000008_grant_rds_iam.sql for why this is a separate,
-- existence-guarded migration rather than being folded into
-- 20260401000003_commerce_api_role.sql itself. medusa_app
-- (20260401000004_medusa_app_role.sql) is deliberately excluded —
-- Medusa connects with a stored password, not RDS Proxy IAM auth, so
-- it never needs this role.

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'rds_iam') THEN
    GRANT rds_iam TO commerce_api_rw;
  END IF;
END
$$;

-- Down Migration

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'rds_iam') THEN
    REVOKE rds_iam FROM commerce_api_rw;
  END IF;
END
$$;
