-- Up Migration
-- Collections (editorial shelves), Inventory (deliberately separate
-- 1:1 table from Books — SPEC-15), and full-text search support.

CREATE TABLE catalog.collections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL,
  description text,
  status      catalog.editorial_status NOT NULL DEFAULT 'draft',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT collections_slug_unique UNIQUE (slug)
);
CREATE TRIGGER trg_collections_updated_at
  BEFORE UPDATE ON catalog.collections
  FOR EACH ROW EXECUTE FUNCTION catalog.set_updated_at();

CREATE TABLE catalog.book_collections (
  book_id       uuid NOT NULL REFERENCES catalog.books(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES catalog.collections(id) ON DELETE CASCADE,
  sort_order    smallint NOT NULL DEFAULT 0,
  PRIMARY KEY (book_id, collection_id)
);

CREATE TYPE catalog.inventory_availability AS ENUM (
  'in_stock', 'out_of_stock', 'preorder', 'discontinued'
);
CREATE TYPE catalog.inventory_updated_by AS ENUM ('adapter', 'editor');

CREATE TABLE catalog.inventory (
  book_id         uuid PRIMARY KEY REFERENCES catalog.books(id) ON DELETE CASCADE,
  sku             text,
  stock           integer NOT NULL DEFAULT 0,
  price           numeric(10,2) NOT NULL,
  currency        char(3) NOT NULL DEFAULT 'INR',
  availability    catalog.inventory_availability NOT NULL DEFAULT 'in_stock',
  last_sync_time  timestamptz,
  updated_by      catalog.inventory_updated_by NOT NULL DEFAULT 'editor',
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_stock_nonnegative CHECK (stock >= 0),
  CONSTRAINT inventory_price_nonnegative CHECK (price >= 0)
);
CREATE TRIGGER trg_inventory_updated_at
  BEFORE UPDATE ON catalog.inventory
  FOR EACH ROW EXECUTE FUNCTION catalog.set_updated_at();

ALTER TABLE catalog.books ADD COLUMN search_vector tsvector;

CREATE OR REPLACE FUNCTION catalog.books_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.subtitle, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.isbn13, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_books_search_vector
  BEFORE INSERT OR UPDATE OF title, subtitle, isbn13 ON catalog.books
  FOR EACH ROW EXECUTE FUNCTION catalog.books_search_vector_update();

CREATE INDEX idx_books_search_vector ON catalog.books USING GIN (search_vector);
CREATE INDEX idx_books_title_trgm ON catalog.books USING GIN (title gin_trgm_ops);
CREATE INDEX idx_authors_canonical_name_trgm ON catalog.authors USING GIN (canonical_name gin_trgm_ops);
CREATE INDEX idx_books_work_id ON catalog.books (work_id);
CREATE INDEX idx_books_publisher_id ON catalog.books (publisher_id);
CREATE INDEX idx_books_status ON catalog.books (status) WHERE status = 'published';
CREATE INDEX idx_works_status ON catalog.works (status) WHERE status = 'published';

-- Down Migration

DROP INDEX IF EXISTS catalog.idx_works_status;
DROP INDEX IF EXISTS catalog.idx_books_status;
DROP INDEX IF EXISTS catalog.idx_books_publisher_id;
DROP INDEX IF EXISTS catalog.idx_books_work_id;
DROP INDEX IF EXISTS catalog.idx_authors_canonical_name_trgm;
DROP INDEX IF EXISTS catalog.idx_books_title_trgm;
DROP INDEX IF EXISTS catalog.idx_books_search_vector;
DROP TRIGGER IF EXISTS trg_books_search_vector ON catalog.books;
DROP FUNCTION IF EXISTS catalog.books_search_vector_update();
ALTER TABLE catalog.books DROP COLUMN IF EXISTS search_vector;
DROP TABLE IF EXISTS catalog.inventory;
DROP TYPE IF EXISTS catalog.inventory_updated_by;
DROP TYPE IF EXISTS catalog.inventory_availability;
DROP TABLE IF EXISTS catalog.book_collections;
DROP TABLE IF EXISTS catalog.collections;
