-- Up Migration
-- Split from plan/database/ddl/catalog.sql per migrations.md — this is
-- not a rewrite, the DDL file remains the documented source of truth.
-- This migration: extensions, schema, shared trigger fn, the editorial
-- lifecycle enum, publishers, media assets, authors, and the taxonomy
-- lookup tables (themes/genres/literary_movements).

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE SCHEMA IF NOT EXISTS catalog;

CREATE OR REPLACE FUNCTION catalog.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TYPE catalog.editorial_status AS ENUM (
  'draft',
  'needs_review',
  'approved',
  'published',
  'archived'
);

CREATE TYPE catalog.publisher_adapter_type AS ENUM (
  'manual', 'html', 'rest', 'graphql', 'csv', 'json_feed'
);

CREATE TABLE catalog.publishers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  code             text NOT NULL,
  website          text,
  country          char(2),
  logo_asset_id    uuid,
  adapter_type     catalog.publisher_adapter_type NOT NULL DEFAULT 'manual',
  active           boolean NOT NULL DEFAULT true,
  last_import_cursor text,
  last_import_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT publishers_code_unique UNIQUE (code)
);
CREATE TRIGGER trg_publishers_updated_at
  BEFORE UPDATE ON catalog.publishers
  FOR EACH ROW EXECUTE FUNCTION catalog.set_updated_at();

CREATE TYPE catalog.media_asset_type AS ENUM ('cover', 'publisher_logo', 'banner', 'author_photo');

CREATE TABLE catalog.media_assets (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type       catalog.media_asset_type NOT NULL,
  s3_key           text NOT NULL,
  content_type     text NOT NULL,
  width_px         integer,
  height_px        integer,
  checksum_sha256  text,
  source_url       text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT media_assets_s3_key_unique UNIQUE (s3_key)
);

ALTER TABLE catalog.publishers
  ADD CONSTRAINT publishers_logo_asset_fk
  FOREIGN KEY (logo_asset_id) REFERENCES catalog.media_assets(id);

CREATE TABLE catalog.authors (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name   text NOT NULL,
  native_name      text,
  biography        text,
  birth_year       integer,
  death_year       integer,
  photo_asset_id   uuid REFERENCES catalog.media_assets(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_authors_updated_at
  BEFORE UPDATE ON catalog.authors
  FOR EACH ROW EXECUTE FUNCTION catalog.set_updated_at();

CREATE TABLE catalog.author_aliases (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id        uuid NOT NULL REFERENCES catalog.authors(id) ON DELETE CASCADE,
  alias            text NOT NULL,
  script           text,
  CONSTRAINT author_aliases_unique UNIQUE (author_id, alias)
);

CREATE TABLE catalog.themes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL,
  description text,
  CONSTRAINT themes_slug_unique UNIQUE (slug)
);

CREATE TABLE catalog.genres (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL,
  description text,
  CONSTRAINT genres_slug_unique UNIQUE (slug)
);

CREATE TABLE catalog.literary_movements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL,
  description text,
  period_start_year integer,
  period_end_year   integer,
  CONSTRAINT literary_movements_slug_unique UNIQUE (slug)
);

-- Down Migration

DROP TABLE IF EXISTS catalog.literary_movements;
DROP TABLE IF EXISTS catalog.genres;
DROP TABLE IF EXISTS catalog.themes;
DROP TABLE IF EXISTS catalog.author_aliases;
DROP TABLE IF EXISTS catalog.authors;
ALTER TABLE catalog.publishers DROP CONSTRAINT IF EXISTS publishers_logo_asset_fk;
DROP TABLE IF EXISTS catalog.media_assets;
DROP TYPE IF EXISTS catalog.media_asset_type;
DROP TABLE IF EXISTS catalog.publishers;
DROP TYPE IF EXISTS catalog.publisher_adapter_type;
DROP TYPE IF EXISTS catalog.editorial_status;
DROP FUNCTION IF EXISTS catalog.set_updated_at();
DROP SCHEMA IF EXISTS catalog;
