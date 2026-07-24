-- Up Migration
-- Grants the `rds_iam` role every IAM-auth DB role needs, deliberately
-- left out of 20260101000005_catalog_readonly_role.sql/
-- 20260101000007_publisher_import_writer_role.sql's own migrations
-- (see those files' own comments) — `rds_iam` only exists on real RDS
-- instances, not vanilla Postgres, so a plain `GRANT rds_iam TO ...`
-- would fail every local/CI run against throwaway Postgres
-- (development/testing.md). Guarding on whether the `rds_iam` role
-- itself exists makes this migration a safe no-op there and a real
-- grant against real RDS, so it can be a normal tracked migration
-- instead of the undocumented manual step runbooks/deploy.md used to
-- carry this as.

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'rds_iam') THEN
    GRANT rds_iam TO catalog_api_readonly;
    GRANT rds_iam TO publisher_import_writer;
  END IF;
END
$$;

-- Down Migration

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'rds_iam') THEN
    REVOKE rds_iam FROM publisher_import_writer;
    REVOKE rds_iam FROM catalog_api_readonly;
  END IF;
END
$$;
