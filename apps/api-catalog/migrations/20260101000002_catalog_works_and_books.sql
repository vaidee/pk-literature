-- Up Migration
-- Works, the work-level junction tables, Books, the status-invariant
-- trigger between them (ADR-008, state-machines/book.md), and
-- edition-specific book_contributors.

CREATE TYPE catalog.work_type AS ENUM (
  'novel', 'short_story_collection', 'poetry_collection',
  'essay_collection', 'drama', 'biography', 'non_fiction', 'other'
);

CREATE TABLE catalog.works (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_title         text NOT NULL,
  canonical_title_translit text,
  original_language       char(2) NOT NULL,
  work_type               catalog.work_type NOT NULL DEFAULT 'other',
  first_publication_year  integer,
  summary                 text,
  status                  catalog.editorial_status NOT NULL DEFAULT 'draft',
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_works_updated_at
  BEFORE UPDATE ON catalog.works
  FOR EACH ROW EXECUTE FUNCTION catalog.set_updated_at();

CREATE TABLE catalog.work_authors (
  work_id     uuid NOT NULL REFERENCES catalog.works(id) ON DELETE CASCADE,
  author_id   uuid NOT NULL REFERENCES catalog.authors(id) ON DELETE RESTRICT,
  role        text NOT NULL DEFAULT 'author',
  sort_order  smallint NOT NULL DEFAULT 0,
  PRIMARY KEY (work_id, author_id, role)
);

CREATE TABLE catalog.work_themes (
  work_id   uuid NOT NULL REFERENCES catalog.works(id) ON DELETE CASCADE,
  theme_id  uuid NOT NULL REFERENCES catalog.themes(id) ON DELETE RESTRICT,
  PRIMARY KEY (work_id, theme_id)
);

CREATE TABLE catalog.work_genres (
  work_id   uuid NOT NULL REFERENCES catalog.works(id) ON DELETE CASCADE,
  genre_id  uuid NOT NULL REFERENCES catalog.genres(id) ON DELETE RESTRICT,
  PRIMARY KEY (work_id, genre_id)
);

CREATE TABLE catalog.work_literary_movements (
  work_id             uuid NOT NULL REFERENCES catalog.works(id) ON DELETE CASCADE,
  literary_movement_id uuid NOT NULL REFERENCES catalog.literary_movements(id) ON DELETE RESTRICT,
  PRIMARY KEY (work_id, literary_movement_id)
);

CREATE TYPE catalog.book_format AS ENUM ('paperback', 'hardcover');

CREATE TABLE catalog.books (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id                uuid NOT NULL REFERENCES catalog.works(id) ON DELETE RESTRICT,
  publisher_id           uuid NOT NULL REFERENCES catalog.publishers(id) ON DELETE RESTRICT,
  translated_from_book_id uuid REFERENCES catalog.books(id),
  isbn13                 char(13),
  title                  text NOT NULL,
  subtitle               text,
  language               char(2) NOT NULL,
  edition_label          text,
  edition_number         smallint,
  format                 catalog.book_format NOT NULL DEFAULT 'paperback',
  page_count             integer,
  publication_date       date,
  cover_asset_id         uuid REFERENCES catalog.media_assets(id),
  status                 catalog.editorial_status NOT NULL DEFAULT 'draft',
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT books_isbn13_unique UNIQUE (isbn13),
  CONSTRAINT books_isbn13_format CHECK (isbn13 IS NULL OR isbn13 ~ '^[0-9]{13}$'),
  CONSTRAINT books_page_count_positive CHECK (page_count IS NULL OR page_count > 0)
);
CREATE TRIGGER trg_books_updated_at
  BEFORE UPDATE ON catalog.books
  FOR EACH ROW EXECUTE FUNCTION catalog.set_updated_at();

CREATE OR REPLACE FUNCTION catalog.enforce_book_work_status()
RETURNS trigger AS $$
DECLARE
  work_status catalog.editorial_status;
BEGIN
  IF NEW.status = 'published' THEN
    SELECT status INTO work_status FROM catalog.works WHERE id = NEW.work_id;
    IF work_status NOT IN ('approved', 'published') THEN
      RAISE EXCEPTION 'Book % cannot be published: work % is not approved (status=%)',
        NEW.id, NEW.work_id, work_status;
    END IF;
    UPDATE catalog.works SET status = 'published'
      WHERE id = NEW.work_id AND status <> 'published';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_books_enforce_work_status
  BEFORE INSERT OR UPDATE OF status ON catalog.books
  FOR EACH ROW EXECUTE FUNCTION catalog.enforce_book_work_status();

CREATE TABLE catalog.book_contributors (
  book_id     uuid NOT NULL REFERENCES catalog.books(id) ON DELETE CASCADE,
  author_id   uuid NOT NULL REFERENCES catalog.authors(id) ON DELETE RESTRICT,
  role        text NOT NULL,
  sort_order  smallint NOT NULL DEFAULT 0,
  PRIMARY KEY (book_id, author_id, role)
);

-- Down Migration

DROP TABLE IF EXISTS catalog.book_contributors;
DROP TRIGGER IF EXISTS trg_books_enforce_work_status ON catalog.books;
DROP FUNCTION IF EXISTS catalog.enforce_book_work_status();
DROP TABLE IF EXISTS catalog.books;
DROP TYPE IF EXISTS catalog.book_format;
DROP TABLE IF EXISTS catalog.work_literary_movements;
DROP TABLE IF EXISTS catalog.work_genres;
DROP TABLE IF EXISTS catalog.work_themes;
DROP TABLE IF EXISTS catalog.work_authors;
DROP TABLE IF EXISTS catalog.works;
DROP TYPE IF EXISTS catalog.work_type;
