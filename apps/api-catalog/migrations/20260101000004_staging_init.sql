-- Up Migration
-- Full staging schema (SPEC-04). Depends on catalog schema for FK
-- targets — must run after the catalog migrations above.

CREATE SCHEMA IF NOT EXISTS staging;

CREATE OR REPLACE FUNCTION staging.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TYPE staging.import_run_status AS ENUM (
  'running', 'completed', 'failed', 'partially_failed'
);

CREATE TABLE staging.import_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id    uuid NOT NULL REFERENCES catalog.publishers(id),
  trigger         text NOT NULL DEFAULT 'scheduled',
  status          staging.import_run_status NOT NULL DEFAULT 'running',
  started_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,
  total_books     integer NOT NULL DEFAULT 0,
  new_books       integer NOT NULL DEFAULT 0,
  updated_books   integer NOT NULL DEFAULT 0,
  rejected_books  integer NOT NULL DEFAULT 0,
  error_summary   text
);
CREATE INDEX idx_import_runs_publisher_id ON staging.import_runs (publisher_id);

CREATE TYPE staging.staging_book_status AS ENUM (
  'pending_validation', 'needs_review', 'approved', 'rejected', 'merged'
);

CREATE TABLE staging.staging_books (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_run_id      uuid NOT NULL REFERENCES staging.import_runs(id) ON DELETE CASCADE,
  publisher_id       uuid NOT NULL REFERENCES catalog.publishers(id),
  source_ref         text NOT NULL,
  raw_payload        jsonb NOT NULL,

  isbn13             char(13),
  title              text,
  subtitle           text,
  author_names       text[],
  publisher_name     text,
  description        text,
  language            char(2),
  cover_source_url    text,
  price               numeric(10,2),
  currency            char(3),
  stock               integer,
  category            text,
  publication_date    date,
  edition_label        text,
  page_count           integer,

  matched_work_id     uuid REFERENCES catalog.works(id),
  matched_book_id      uuid REFERENCES catalog.books(id),
  match_confidence     numeric(4,3),

  status               staging.staging_book_status NOT NULL DEFAULT 'pending_validation',
  reviewed_by           text,
  reviewed_at            timestamptz,
  review_decision_notes   text,

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT staging_books_source_unique UNIQUE (publisher_id, source_ref)
);
CREATE TRIGGER trg_staging_books_updated_at
  BEFORE UPDATE ON staging.staging_books
  FOR EACH ROW EXECUTE FUNCTION staging.set_updated_at();
CREATE INDEX idx_staging_books_import_run_id ON staging.staging_books (import_run_id);
CREATE INDEX idx_staging_books_status ON staging.staging_books (status);
CREATE INDEX idx_staging_books_isbn13 ON staging.staging_books (isbn13);

CREATE TABLE staging.staging_inventory (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staging_book_id  uuid NOT NULL REFERENCES staging.staging_books(id) ON DELETE CASCADE,
  sku              text,
  stock            integer,
  price            numeric(10,2),
  currency         char(3),
  availability     text,
  captured_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_staging_inventory_staging_book_id ON staging.staging_inventory (staging_book_id);

CREATE TYPE staging.media_status AS ENUM (
  'pending', 'downloaded', 'virus_scanned', 'optimized', 'uploaded', 'failed'
);

CREATE TABLE staging.staging_media (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staging_book_id  uuid NOT NULL REFERENCES staging.staging_books(id) ON DELETE CASCADE,
  source_url       text NOT NULL,
  status           staging.media_status NOT NULL DEFAULT 'pending',
  s3_key           text,
  checksum_sha256  text,
  failure_reason   text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_staging_media_staging_book_id ON staging.staging_media (staging_book_id);

CREATE TYPE staging.validation_severity AS ENUM ('warning', 'error');

CREATE TABLE staging.staging_validation (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staging_book_id  uuid NOT NULL REFERENCES staging.staging_books(id) ON DELETE CASCADE,
  severity         staging.validation_severity NOT NULL,
  code             text NOT NULL,
  message          text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_staging_validation_staging_book_id ON staging.staging_validation (staging_book_id);

CREATE TABLE staging.staging_relationships (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staging_book_id   uuid NOT NULL REFERENCES staging.staging_books(id) ON DELETE CASCADE,
  relationship_type text NOT NULL,
  target_label      text NOT NULL,
  target_id         uuid,
  suggested_by      text NOT NULL DEFAULT 'adapter',
  confidence        numeric(4,3),
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_staging_relationships_staging_book_id ON staging.staging_relationships (staging_book_id);

-- Down Migration

DROP TABLE IF EXISTS staging.staging_relationships;
DROP TABLE IF EXISTS staging.staging_validation;
DROP TYPE IF EXISTS staging.validation_severity;
DROP TABLE IF EXISTS staging.staging_media;
DROP TYPE IF EXISTS staging.media_status;
DROP TABLE IF EXISTS staging.staging_inventory;
DROP TABLE IF EXISTS staging.staging_books;
DROP TYPE IF EXISTS staging.staging_book_status;
DROP TABLE IF EXISTS staging.import_runs;
DROP TYPE IF EXISTS staging.import_run_status;
DROP FUNCTION IF EXISTS staging.set_updated_at();
DROP SCHEMA IF EXISTS staging;
