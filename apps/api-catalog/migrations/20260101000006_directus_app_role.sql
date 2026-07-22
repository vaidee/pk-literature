-- Up Migration
-- DB role for the Directus ECS task (infrastructure/iam.md: "ecs-directus:
-- RDS Proxy connect (read/write catalog + staging — Directus is the sole
-- write path into catalog, SPEC-03)"). Unlike catalog_api_readonly,
-- Directus needs a STORED password (via ECS task definition secrets
-- injection from Secrets Manager), not RDS Proxy IAM auth — Directus's
-- Knex-based Postgres client has no built-in support for dynamic IAM
-- token refresh the way apps/api-catalog's Kysely setup does. See the
-- exception noted in infrastructure/secrets.md.
--
-- Directus's own system tables (directus_collections, directus_users,
-- etc.) live in a dedicated `directus` schema, created here — kept
-- separate from `catalog`/`staging` so Directus's internal bookkeeping
-- never collides with our own tables, matching the schema-per-domain
-- convention (naming.md).
--
-- NOT independently verified against a live Directus instance — see
-- apps/directus/README.md's "Known issue" section. Live bootstrap of
-- Directus 11.17.4 and 12.1.1 both crashed with an apparently
-- version-internal bug (reproduces even against a completely empty
-- database with none of our tables present, so it is not a
-- permissions/schema issue on our side). The role/schema/grants below
-- follow the exact same pattern already validated end-to-end for
-- catalog_api_readonly (migration 20260101000005) — SELECT/INSERT
-- tested directly via psql — just with INSERT/UPDATE/DELETE added and
-- staging included, per iam.md's ecs-directus grant list.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'directus_app') THEN
    CREATE ROLE directus_app WITH LOGIN;
  END IF;
END
$$;

CREATE SCHEMA IF NOT EXISTS directus;
GRANT ALL ON SCHEMA directus TO directus_app;
ALTER ROLE directus_app SET search_path TO directus;

GRANT USAGE ON SCHEMA catalog TO directus_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA catalog TO directus_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA catalog GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO directus_app;

GRANT USAGE ON SCHEMA staging TO directus_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA staging TO directus_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA staging GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO directus_app;

-- Down Migration

ALTER DEFAULT PRIVILEGES IN SCHEMA staging REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM directus_app;
REVOKE SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA staging FROM directus_app;
REVOKE USAGE ON SCHEMA staging FROM directus_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA catalog REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM directus_app;
REVOKE SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA catalog FROM directus_app;
REVOKE USAGE ON SCHEMA catalog FROM directus_app;
DROP SCHEMA IF EXISTS directus CASCADE;
DROP ROLE IF EXISTS directus_app;
