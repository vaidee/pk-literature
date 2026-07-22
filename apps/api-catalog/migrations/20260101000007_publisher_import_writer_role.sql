-- Up Migration
-- DB role for the staging-ingest Lambda (infrastructure/iam.md's
-- lambda-api-publisher-import: "RDS Proxy connect (write staging
-- schema only ... per SPEC-04's 'adapters shall not modify production
-- catalog')"). Same IAM-auth-via-RDS-Proxy pattern as
-- catalog_api_readonly (migration 20260101000005), not a stored
-- password — this Lambda isn't in the same NAT-free-but-otherwise-
-- normal category as Directus/Medusa's Knex-based clients.
--
-- NOT done here, must be run manually against the real deployed RDS
-- instance after this migration, same as migration 20260101000005:
-- `GRANT rds_iam TO publisher_import_writer;` — `rds_iam` only exists
-- on real RDS instances. See runbooks/deploy.md.
--
-- Read-only reconciliation with iam.md's literal wording: iam.md says
-- "no grant on catalog" for this role, but ADR-009 and SPEC-04 §5 both
-- require this Lambda to run duplicate detection, which means reading
-- catalog.works/books/authors to find candidate matches. SPEC-04 §3's
-- actual non-goals are about *writing* ("Publish directly", "Modify
-- production catalog", "Delete books", "Modify editorial metadata") —
-- nothing there rules out reads. Read this migration as the more
-- precise version of that rule: SELECT-only on catalog (enables
-- duplicate detection), zero INSERT/UPDATE/DELETE on catalog content.
--
-- One narrow exception to even that: UPDATE on exactly
-- catalog.publishers(last_import_cursor, last_import_at) — the
-- adapter-owned incremental-import watermark (SPEC-04 §21, ADR-009),
-- written back by the staging-ingest API on successful run completion.
-- This is bookkeeping on the Publisher record's own adapter-config
-- columns, not the "editorial metadata" or "production catalog
-- content" the non-goals are about — scoped with a column-level GRANT
-- so it can't be widened to any other column on that table by accident.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'publisher_import_writer') THEN
    CREATE ROLE publisher_import_writer WITH LOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA catalog TO publisher_import_writer;
GRANT SELECT ON ALL TABLES IN SCHEMA catalog TO publisher_import_writer;
ALTER DEFAULT PRIVILEGES IN SCHEMA catalog GRANT SELECT ON TABLES TO publisher_import_writer;
GRANT UPDATE (last_import_cursor, last_import_at) ON catalog.publishers TO publisher_import_writer;

GRANT USAGE ON SCHEMA staging TO publisher_import_writer;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA staging TO publisher_import_writer;
ALTER DEFAULT PRIVILEGES IN SCHEMA staging GRANT SELECT, INSERT, UPDATE ON TABLES TO publisher_import_writer;

-- Down Migration

ALTER DEFAULT PRIVILEGES IN SCHEMA staging REVOKE SELECT, INSERT, UPDATE ON TABLES FROM publisher_import_writer;
REVOKE SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA staging FROM publisher_import_writer;
REVOKE USAGE ON SCHEMA staging FROM publisher_import_writer;
REVOKE UPDATE (last_import_cursor, last_import_at) ON catalog.publishers FROM publisher_import_writer;
ALTER DEFAULT PRIVILEGES IN SCHEMA catalog REVOKE SELECT ON TABLES FROM publisher_import_writer;
REVOKE SELECT ON ALL TABLES IN SCHEMA catalog FROM publisher_import_writer;
REVOKE USAGE ON SCHEMA catalog FROM publisher_import_writer;
DROP ROLE IF EXISTS publisher_import_writer;
