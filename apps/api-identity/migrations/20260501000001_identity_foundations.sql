-- Up Migration
-- identity schema (plan/database/ddl/identity.sql — see that file's
-- header for the full design rationale). "One migration directory per
-- owning service" (migrations.md) — apps/api-identity owns every
-- migration touching `identity`, same convention as every other
-- schema's owning service.

CREATE SCHEMA IF NOT EXISTS identity;

CREATE EXTENSION IF NOT EXISTS citext;

CREATE OR REPLACE FUNCTION identity.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE identity.users (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email               citext NOT NULL,
  password_hash       text,
  display_name        text NOT NULL,
  phone               text,
  preferred_language  text NOT NULL DEFAULT 'ta',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_unique UNIQUE (email)
);
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON identity.users
  FOR EACH ROW EXECUTE FUNCTION identity.set_updated_at();

CREATE TABLE identity.sessions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,
  user_agent         text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  expires_at         timestamptz NOT NULL,
  revoked_at         timestamptz,
  CONSTRAINT sessions_refresh_token_hash_unique UNIQUE (refresh_token_hash)
);
CREATE INDEX idx_sessions_user_id ON identity.sessions (user_id);

CREATE TABLE identity.addresses (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  recipient_name text NOT NULL,
  line1          text NOT NULL,
  line2          text,
  city           text NOT NULL,
  state          text NOT NULL,
  postal_code    text NOT NULL,
  country        char(2) NOT NULL DEFAULT 'IN',
  phone          text NOT NULL,
  is_default     boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_addresses_updated_at
  BEFORE UPDATE ON identity.addresses
  FOR EACH ROW EXECUTE FUNCTION identity.set_updated_at();
CREATE INDEX idx_addresses_user_id ON identity.addresses (user_id);
CREATE UNIQUE INDEX idx_addresses_one_default_per_user ON identity.addresses (user_id) WHERE is_default;

CREATE TABLE identity.anonymous_profiles (
  anonymous_id        uuid PRIMARY KEY,
  first_seen_at       timestamptz NOT NULL DEFAULT now(),
  last_seen_at        timestamptz NOT NULL DEFAULT now(),
  merged_into_user_id uuid REFERENCES identity.users(id),
  merged_at           timestamptz
);

CREATE TABLE identity.profile_preferences (
  user_id                      uuid PRIMARY KEY REFERENCES identity.users(id) ON DELETE CASCADE,
  email_notifications_enabled  boolean NOT NULL DEFAULT true,
  sms_notifications_enabled    boolean NOT NULL DEFAULT false,
  sync_enabled                 boolean NOT NULL DEFAULT true,
  updated_at                   timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_profile_preferences_updated_at
  BEFORE UPDATE ON identity.profile_preferences
  FOR EACH ROW EXECUTE FUNCTION identity.set_updated_at();

-- Down Migration

DROP TABLE IF EXISTS identity.profile_preferences;
DROP TABLE IF EXISTS identity.anonymous_profiles;
DROP TABLE IF EXISTS identity.addresses;
DROP TABLE IF EXISTS identity.sessions;
DROP TABLE IF EXISTS identity.users;
DROP FUNCTION IF EXISTS identity.set_updated_at();
DROP SCHEMA IF EXISTS identity;
