-- discovery schema
-- Anonymous personalization + feed shelving (SPEC-05). Owned/written by
-- apps/api-feed as feed_api_rw. Depends on catalog schema for FK
-- targets (books, collections) — read-only from this schema's
-- perspective (infrastructure/iam.md: feed_api_rw is read-only on
-- catalog).
--
-- Anonymous ID note: SPEC-07 (Identity, not yet built) eventually owns
-- a formal "Secure cookie + Anonymous UUID" session mechanism
-- (anonymous_profiles, in the identity schema). Until that lands, the
-- anonymous_id here is whatever UUID the client generated and sent
-- (apps/api-feed/README.md) — this schema's own interest_profiles
-- table is not the same table SPEC-07 describes, and reconciling the
-- two is left to Phase 7.

CREATE SCHEMA IF NOT EXISTS discovery;

CREATE OR REPLACE FUNCTION discovery.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- Interest profiles + events — SPEC-05 "Anonymous Personalization" /
-- "Like Signal". Append-only event log (not a mutable "is this book
-- liked" flag) so a like can be reversed by appending an 'unlike'
-- event (SPEC-05 Business Rules: "Likes are reversible") without
-- losing the history, and so the same log can carry other signal types
-- later (view, add_to_cart) without a schema change.
-- ---------------------------------------------------------------------

CREATE TABLE discovery.interest_profiles (
  anonymous_id uuid PRIMARY KEY,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_interest_profiles_updated_at
  BEFORE UPDATE ON discovery.interest_profiles
  FOR EACH ROW EXECUTE FUNCTION discovery.set_updated_at();

CREATE TYPE discovery.interest_action AS ENUM ('like', 'unlike', 'view', 'add_to_cart');

CREATE TABLE discovery.interest_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id  uuid NOT NULL REFERENCES discovery.interest_profiles(anonymous_id) ON DELETE CASCADE,
  book_id       uuid NOT NULL REFERENCES catalog.books(id) ON DELETE CASCADE,
  action        discovery.interest_action NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
-- Current-liked-state derivation ("most recent like/unlike for this
-- pair") and "what has this profile liked" both filter on
-- (anonymous_id, book_id) ordered by recency.
CREATE INDEX idx_interest_events_profile_book ON discovery.interest_events (anonymous_id, book_id, created_at DESC);
-- Trending shelf candidate query: recent like counts per book.
CREATE INDEX idx_interest_events_book_action_time ON discovery.interest_events (book_id, action, created_at DESC);

-- ---------------------------------------------------------------------
-- Feed shelves — SPEC-05 "Feed Structure" / "Data Model". Only
-- 'editorial' shelves are literally rows an editor curated (backed by
-- an existing catalog.collections entry — "From Kalachuvadu",
-- "Modern Tamil Fiction", "Editor's Picks" are all really just
-- published Collections surfaced on the homepage, not a separate
-- curation surface). The other types are generated at request time,
-- not stored as a book list — this table only carries their
-- display metadata (name, sort_order, enabled) and, for
-- 'personalized_similar'/'trending'/'recently_viewed', a feature flag
-- gate (SPEC-05 "Feature Flags": all default OFF except editorial
-- shelves and New Arrivals).
-- ---------------------------------------------------------------------

CREATE TYPE discovery.shelf_type AS ENUM (
  'editorial', 'new_arrivals', 'trending', 'personalized_similar', 'recently_viewed'
);

CREATE TABLE discovery.feed_shelves (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text NOT NULL,
  type          discovery.shelf_type NOT NULL,
  -- Set only for type='editorial'; the enforce_editorial_shelf_collection
  -- trigger below keeps the two in sync rather than relying on
  -- application code alone.
  collection_id uuid REFERENCES catalog.collections(id),
  sort_order    smallint NOT NULL DEFAULT 0,
  enabled       boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feed_shelves_slug_unique UNIQUE (slug)
);
CREATE TRIGGER trg_feed_shelves_updated_at
  BEFORE UPDATE ON discovery.feed_shelves
  FOR EACH ROW EXECUTE FUNCTION discovery.set_updated_at();

CREATE OR REPLACE FUNCTION discovery.enforce_editorial_shelf_collection()
RETURNS trigger AS $$
BEGIN
  IF NEW.type = 'editorial' AND NEW.collection_id IS NULL THEN
    RAISE EXCEPTION 'feed_shelves.collection_id is required when type = editorial';
  END IF;
  IF NEW.type <> 'editorial' AND NEW.collection_id IS NOT NULL THEN
    RAISE EXCEPTION 'feed_shelves.collection_id must be null when type <> editorial';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_feed_shelves_enforce_collection
  BEFORE INSERT OR UPDATE OF type, collection_id ON discovery.feed_shelves
  FOR EACH ROW EXECUTE FUNCTION discovery.enforce_editorial_shelf_collection();

CREATE INDEX idx_feed_shelves_enabled_sort ON discovery.feed_shelves (sort_order) WHERE enabled = true;
