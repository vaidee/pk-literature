-- Up Migration
-- DB role for the Search Lambda. infrastructure/iam.md documents
-- lambda-api-search as "RDS Proxy connect (read-only, catalog)" — this
-- migration also grants read-only on `discovery`, which iam.md didn't
-- originally call out. SPEC-08 §21 ("Personalization: Anonymous
-- Profile -> Liked Themes/Authors/Publishers -> Ranking Boost") and
-- its Acceptance Criteria ("Anonymous personalization influences
-- ranking") both require reading discovery.interest_events — the same
-- table Feed's own personalized-similar shelf reads (apps/api-feed).
-- Without it, ranking's lowest-weighted signal (Personalization,
-- weight 30, SPEC-08 §12) would be unimplementable, not just
-- deprioritized. iam.md is updated alongside this migration to match.
--
-- IAM auth via RDS Proxy, same pattern as every other *_readonly role
-- so far (catalog_api_readonly, feed_api_rw's read half).
--
-- NOT done here, must be run manually against the real deployed RDS
-- instance after this migration, same as prior role migrations:
-- `GRANT rds_iam TO search_api_readonly;` — `rds_iam` only exists on
-- real RDS instances. See runbooks/deploy.md.
--
-- Depends on both catalog (apps/api-catalog's migrations) and
-- discovery (apps/api-feed's migrations) already existing — an
-- operational deploy-order concern (phase-1 and phase-4 before
-- phase-5), not something node-pg-migrate enforces across services'
-- independent migration histories/tracking tables.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'search_api_readonly') THEN
    CREATE ROLE search_api_readonly WITH LOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA catalog TO search_api_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA catalog TO search_api_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA catalog GRANT SELECT ON TABLES TO search_api_readonly;

GRANT USAGE ON SCHEMA discovery TO search_api_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA discovery TO search_api_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA discovery GRANT SELECT ON TABLES TO search_api_readonly;

-- Down Migration

ALTER DEFAULT PRIVILEGES IN SCHEMA discovery REVOKE SELECT ON TABLES FROM search_api_readonly;
REVOKE SELECT ON ALL TABLES IN SCHEMA discovery FROM search_api_readonly;
REVOKE USAGE ON SCHEMA discovery FROM search_api_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA catalog REVOKE SELECT ON TABLES FROM search_api_readonly;
REVOKE SELECT ON ALL TABLES IN SCHEMA catalog FROM search_api_readonly;
REVOKE USAGE ON SCHEMA catalog FROM search_api_readonly;
DROP ROLE IF EXISTS search_api_readonly;
