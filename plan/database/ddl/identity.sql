-- identity schema
-- User accounts, sessions, saved addresses, anonymous-session tracking,
-- and profile preferences (SPEC-07). Owned/written by apps/api-identity
-- as identity_api_rw (infrastructure/iam.md: lambda-api-identity).
--
-- "Editorial Users: Managed separately through Directus authentication"
-- (SPEC-07) — this schema never overlaps with directus_app's own user
-- tables; editorial auth and customer identity are deliberately
-- isolated systems, per the spec's own acceptance criterion
-- ("Editorial authentication remains isolated from customer identity").
--
-- Relationship to commerce.customers (SPEC-06): that table is Commerce's
-- own lightweight "contact details captured at an anonymous checkout"
-- record, not an authenticated account — commerce.sql's own header
-- comment already flags this as provisional pending Phase 7. This
-- schema is the real identity system; on registration,
-- apps/api-identity emits a UserRegistered event that
-- apps/api-commerce consumes to create/link a commerce.customers row
-- keyed by the same id (see apps/api-commerce's eventbridge consumer)
-- and merge the anonymous cart — SPEC-07's "Anonymous Merge: Cart" —
-- rather than this schema reaching into commerce's tables directly
-- (coding-guidelines.md: "A service never imports another service's
-- internal modules").

CREATE SCHEMA IF NOT EXISTS identity;

CREATE EXTENSION IF NOT EXISTS citext; -- case-insensitive email column

CREATE OR REPLACE FUNCTION identity.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- Users. password_hash is nullable, not NOT NULL — SPEC-07's Security
-- section calls for a "Passwordless-ready architecture" and its own
-- Authentication section lists Email+OTP/Google/Apple as "(future)"
-- methods alongside today's email+password; a future OTP-only or
-- OAuth-only account should be representable without inventing a dummy
-- password. preferred_language is a plain SPEC-07 "User Profile" field
-- (not the notification/sync settings below, which are a separate
-- concern the spec lists as its own table).
-- ---------------------------------------------------------------------

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

-- ---------------------------------------------------------------------
-- Sessions back the refresh-token half of SPEC-07's "Registered:
-- JWT access token, Refresh token, Secure HTTP-only cookies" — the
-- access token is a short-lived, stateless, signed JWT (never stored
-- here); only the longer-lived refresh token needs server-side state,
-- since logout/revocation has to actually invalidate something a
-- stateless JWT can't represent on its own. Only the SHA-256 hash of
-- the refresh token is stored (same "never store the credential
-- itself" reasoning as password_hash) — a leaked DB row can't be
-- replayed as a session.
-- ---------------------------------------------------------------------

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

-- ---------------------------------------------------------------------
-- Address book (SPEC-07 "Address Book") — a *saved, reusable* address
-- list a registered user manages via GET/POST/PATCH/DELETE /addresses.
-- Distinct from commerce.addresses, which is an immutable snapshot
-- captured at checkout time (commerce.sql's own header comment) — a
-- user editing/deleting a saved address here must never alter an
-- already-placed order's shipping address.
-- ---------------------------------------------------------------------

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
-- At most one default address per user (SPEC-07 "default_flag") —
-- application code clears any prior default before setting a new one,
-- but this partial unique index is the actual invariant enforcement,
-- same "don't trust application code alone" pattern as
-- commerce.cart's idx_cart_one_active_per_customer.
CREATE UNIQUE INDEX idx_addresses_one_default_per_user ON identity.addresses (user_id) WHERE is_default;

-- ---------------------------------------------------------------------
-- Anonymous profiles. SPEC-07's Identity Model: "Anonymous Session ->
-- Anonymous UUID -> Interest Profile -> (Optional) Create Account ->
-- Merge Anonymous Data -> Registered Profile". This table is the
-- lifecycle record for that UUID (the same X-Anonymous-Id every other
-- service — api-feed, api-search, api-commerce — already scopes
-- anonymous data by); merged_into_user_id/merged_at record that the
-- merge happened, once, so a UserRegistered event redelivery can't
-- double-merge (SPEC-07 "Do not duplicate events").
-- ---------------------------------------------------------------------

CREATE TABLE identity.anonymous_profiles (
  anonymous_id        uuid PRIMARY KEY,
  first_seen_at       timestamptz NOT NULL DEFAULT now(),
  last_seen_at        timestamptz NOT NULL DEFAULT now(),
  merged_into_user_id uuid REFERENCES identity.users(id),
  merged_at           timestamptz
);

-- ---------------------------------------------------------------------
-- Profile preferences — SPEC-07's "Registered User" capabilities
-- ("Sync preferences across devices", "Email notifications"), kept as
-- its own table (per SPEC-07's Database table list) rather than columns
-- on users, since this is where future sync/notification-channel
-- settings grow without widening the core identity row.
-- ---------------------------------------------------------------------

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
