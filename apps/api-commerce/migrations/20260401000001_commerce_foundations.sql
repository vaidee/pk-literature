-- Up Migration
-- Commerce foundations (SPEC-06): customers, addresses, cart, cart
-- items. Source design doc: plan/database/ddl/commerce.sql — see that
-- file's own comments for the full rationale (why cart_items snapshots
-- title/price rather than joining catalog live, the anonymous-vs-
-- customer cart-ownership CHECK, partial unique indexes over a
-- table-wide UNIQUE). Depends on catalog.books already existing
-- (apps/api-catalog's migrations, applied first).

CREATE SCHEMA IF NOT EXISTS commerce;

CREATE OR REPLACE FUNCTION commerce.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE commerce.customers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text,
  phone      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON commerce.customers
  FOR EACH ROW EXECUTE FUNCTION commerce.set_updated_at();

CREATE TABLE commerce.addresses (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id    uuid REFERENCES commerce.customers(id) ON DELETE CASCADE,
  recipient_name text NOT NULL,
  line1          text NOT NULL,
  line2          text,
  city           text NOT NULL,
  state          text NOT NULL,
  postal_code    text NOT NULL,
  country        char(2) NOT NULL DEFAULT 'IN',
  phone          text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_addresses_customer_id ON commerce.addresses (customer_id);

CREATE TYPE commerce.cart_status AS ENUM ('active', 'merged', 'converted', 'abandoned');

CREATE TABLE commerce.cart (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id  uuid,
  customer_id   uuid REFERENCES commerce.customers(id) ON DELETE CASCADE,
  status        commerce.cart_status NOT NULL DEFAULT 'active',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cart_owner_check CHECK (
    (anonymous_id IS NOT NULL AND customer_id IS NULL) OR
    (anonymous_id IS NULL AND customer_id IS NOT NULL)
  )
);
CREATE TRIGGER trg_cart_updated_at
  BEFORE UPDATE ON commerce.cart
  FOR EACH ROW EXECUTE FUNCTION commerce.set_updated_at();
CREATE UNIQUE INDEX idx_cart_one_active_per_anonymous ON commerce.cart (anonymous_id) WHERE status = 'active' AND anonymous_id IS NOT NULL;
CREATE UNIQUE INDEX idx_cart_one_active_per_customer ON commerce.cart (customer_id) WHERE status = 'active' AND customer_id IS NOT NULL;

CREATE TABLE commerce.cart_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id        uuid NOT NULL REFERENCES commerce.cart(id) ON DELETE CASCADE,
  book_id        uuid NOT NULL REFERENCES catalog.books(id),
  title_snapshot text NOT NULL,
  unit_price     numeric(10,2) NOT NULL,
  currency       char(3) NOT NULL DEFAULT 'INR',
  quantity       integer NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT cart_items_unit_price_nonnegative CHECK (unit_price >= 0),
  CONSTRAINT cart_items_cart_book_unique UNIQUE (cart_id, book_id)
);
CREATE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON commerce.cart_items
  FOR EACH ROW EXECUTE FUNCTION commerce.set_updated_at();
CREATE INDEX idx_cart_items_cart_id ON commerce.cart_items (cart_id);

-- Down Migration

DROP TABLE IF EXISTS commerce.cart_items;
DROP TABLE IF EXISTS commerce.cart;
DROP TYPE IF EXISTS commerce.cart_status;
DROP TABLE IF EXISTS commerce.addresses;
DROP TABLE IF EXISTS commerce.customers;
DROP FUNCTION IF EXISTS commerce.set_updated_at();
DROP SCHEMA IF EXISTS commerce;
