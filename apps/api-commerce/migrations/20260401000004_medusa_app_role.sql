-- Up Migration
-- DB role for the Medusa ECS task (infrastructure/iam.md: "ecs-medusa:
-- RDS Proxy connect (read/write commerce)"). Unlike commerce_api_rw,
-- Medusa needs a STORED password (via ECS task definition secrets
-- injection from Secrets Manager), not RDS Proxy IAM auth — same
-- exception already made for Directus (migration 20260101000006 in
-- apps/api-catalog/migrations, infrastructure/secrets.md): Medusa's
-- own Postgres client (like Directus's) has no built-in support for
-- dynamic IAM token refresh.
--
-- Medusa's own internal bookkeeping tables (if any end up distinct
-- from the commerce.* tables this repo already defines) would live in
-- a dedicated `medusa` schema, mirroring Directus's own `directus`
-- schema split — created here for the same reason: keep Medusa's
-- internal state out of the `commerce` tables apps/api-commerce
-- also writes to directly, so a version upgrade of Medusa's own schema
-- can never collide with ours.
--
-- NOT independently verified against a live Medusa instance — see
-- apps/medusa/README.md's "Known issue" section, the same category of
-- sandbox limitation already documented for Directus in phase-2.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'medusa_app') THEN
    CREATE ROLE medusa_app WITH LOGIN;
  END IF;
END
$$;

CREATE SCHEMA IF NOT EXISTS medusa;
GRANT ALL ON SCHEMA medusa TO medusa_app;
ALTER ROLE medusa_app SET search_path TO medusa;

GRANT USAGE ON SCHEMA commerce TO medusa_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA commerce TO medusa_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA commerce GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO medusa_app;

-- Down Migration

ALTER DEFAULT PRIVILEGES IN SCHEMA commerce REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM medusa_app;
REVOKE SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA commerce FROM medusa_app;
REVOKE USAGE ON SCHEMA commerce FROM medusa_app;
DROP SCHEMA IF EXISTS medusa CASCADE;
DROP ROLE IF EXISTS medusa_app;
