-- Up Migration
-- DB role for the Commerce Lambda (infrastructure/iam.md:
-- "lambda-api-commerce: RDS Proxy connect (read/write commerce schema,
-- read-only catalog for inventory checks at checkout)"). IAM auth via
-- RDS Proxy, same pattern as every other *_readonly/*_rw role so far.
--
-- NOT done here, must be run manually against the real deployed RDS
-- instance after this migration, same as prior role migrations:
-- `GRANT rds_iam TO commerce_api_rw;` — `rds_iam` only exists on real
-- RDS instances. See runbooks/deploy.md.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'commerce_api_rw') THEN
    CREATE ROLE commerce_api_rw WITH LOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA commerce TO commerce_api_rw;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA commerce TO commerce_api_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA commerce GRANT SELECT, INSERT, UPDATE ON TABLES TO commerce_api_rw;

-- Checkout validates inventory (SPEC-06: "Checkout validates inventory
-- before payment. Inventory ownership remains in Catalog.") — a live
-- read against catalog.inventory/books, never a write.
GRANT USAGE ON SCHEMA catalog TO commerce_api_rw;
GRANT SELECT ON ALL TABLES IN SCHEMA catalog TO commerce_api_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA catalog GRANT SELECT ON TABLES TO commerce_api_rw;

-- Down Migration

ALTER DEFAULT PRIVILEGES IN SCHEMA catalog REVOKE SELECT ON TABLES FROM commerce_api_rw;
REVOKE SELECT ON ALL TABLES IN SCHEMA catalog FROM commerce_api_rw;
REVOKE USAGE ON SCHEMA catalog FROM commerce_api_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA commerce REVOKE SELECT, INSERT, UPDATE ON TABLES FROM commerce_api_rw;
REVOKE SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA commerce FROM commerce_api_rw;
REVOKE USAGE ON SCHEMA commerce FROM commerce_api_rw;
DROP ROLE IF EXISTS commerce_api_rw;
