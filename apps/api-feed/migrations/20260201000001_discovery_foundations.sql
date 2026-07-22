-- Up Migration
-- Discovery Feed foundations (SPEC-05). Source design doc:
-- plan/database/ddl/discovery.sql — this migration applies it
-- verbatim; see that file's own comments for the full rationale
-- (append-only interest events for reversible likes, the
-- editorial-shelf/catalog.collections trigger-enforced link, etc.).
-- Depends on catalog.books/catalog.collections already existing
-- (apps/api-catalog's migrations, applied first).

CREATE SCHEMA IF NOT EXISTS discovery;

CREATE OR REPLACE FUNCTION discovery.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
CREATE INDEX idx_interest_events_profile_book ON discovery.interest_events (anonymous_id, book_id, created_at DESC);
CREATE INDEX idx_interest_events_book_action_time ON discovery.interest_events (book_id, action, created_at DESC);

CREATE TYPE discovery.shelf_type AS ENUM (
  'editorial', 'new_arrivals', 'trending', 'personalized_similar', 'recently_viewed'
);

CREATE TABLE discovery.feed_shelves (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text NOT NULL,
  type          discovery.shelf_type NOT NULL,
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

-- Down Migration

DROP TABLE IF EXISTS discovery.feed_shelves;
DROP FUNCTION IF EXISTS discovery.enforce_editorial_shelf_collection();
DROP TYPE IF EXISTS discovery.shelf_type;
DROP TABLE IF EXISTS discovery.interest_events;
DROP TYPE IF EXISTS discovery.interest_action;
DROP TABLE IF EXISTS discovery.interest_profiles;
DROP FUNCTION IF EXISTS discovery.set_updated_at();
DROP SCHEMA IF EXISTS discovery;
