-- Up Migration
-- Orders, payments, shipments, refunds (SPEC-06). See
-- plan/database/ddl/commerce.sql for the full rationale — notably
-- payments.idempotency_key's UNIQUE constraint enforcing "Idempotent
-- payment processing" at the DB level, not just in application code.

CREATE TYPE commerce.order_status AS ENUM (
  'draft', 'pending_payment', 'paid', 'packed', 'shipped', 'delivered',
  'completed', 'cancelled', 'refunded', 'returned'
);

CREATE TABLE commerce.orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number        text NOT NULL,
  customer_id         uuid REFERENCES commerce.customers(id),
  cart_id             uuid REFERENCES commerce.cart(id),
  status              commerce.order_status NOT NULL DEFAULT 'draft',
  subtotal            numeric(10,2) NOT NULL,
  shipping_cost       numeric(10,2) NOT NULL DEFAULT 0,
  total               numeric(10,2) NOT NULL,
  currency            char(3) NOT NULL DEFAULT 'INR',
  shipping_address_id uuid REFERENCES commerce.addresses(id),
  billing_address_id  uuid REFERENCES commerce.addresses(id),
  contact_email       text,
  contact_phone       text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_order_number_unique UNIQUE (order_number),
  CONSTRAINT orders_subtotal_nonnegative CHECK (subtotal >= 0),
  CONSTRAINT orders_total_nonnegative CHECK (total >= 0)
);
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON commerce.orders
  FOR EACH ROW EXECUTE FUNCTION commerce.set_updated_at();
CREATE INDEX idx_orders_customer_id ON commerce.orders (customer_id);
CREATE INDEX idx_orders_status ON commerce.orders (status);

CREATE TABLE commerce.order_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       uuid NOT NULL REFERENCES commerce.orders(id) ON DELETE CASCADE,
  book_id        uuid NOT NULL REFERENCES catalog.books(id),
  title_snapshot text NOT NULL,
  unit_price     numeric(10,2) NOT NULL,
  currency       char(3) NOT NULL DEFAULT 'INR',
  quantity       integer NOT NULL,
  CONSTRAINT order_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT order_items_unit_price_nonnegative CHECK (unit_price >= 0)
);
CREATE INDEX idx_order_items_order_id ON commerce.order_items (order_id);

CREATE TYPE commerce.payment_status AS ENUM ('created', 'captured', 'failed', 'refunded');

CREATE TABLE commerce.payments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             uuid NOT NULL REFERENCES commerce.orders(id),
  provider             text NOT NULL DEFAULT 'razorpay',
  razorpay_order_id    text NOT NULL,
  razorpay_payment_id  text,
  razorpay_signature   text,
  amount               numeric(10,2) NOT NULL,
  currency             char(3) NOT NULL DEFAULT 'INR',
  status               commerce.payment_status NOT NULL DEFAULT 'created',
  idempotency_key      text NOT NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payments_idempotency_key_unique UNIQUE (idempotency_key),
  CONSTRAINT payments_amount_nonnegative CHECK (amount >= 0)
);
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON commerce.payments
  FOR EACH ROW EXECUTE FUNCTION commerce.set_updated_at();
CREATE INDEX idx_payments_order_id ON commerce.payments (order_id);
CREATE INDEX idx_payments_razorpay_order_id ON commerce.payments (razorpay_order_id);

CREATE TYPE commerce.shipment_status AS ENUM ('pending', 'shipped', 'delivered');

CREATE TABLE commerce.shipments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES commerce.orders(id),
  carrier         text,
  tracking_number text,
  status          commerce.shipment_status NOT NULL DEFAULT 'pending',
  shipped_at      timestamptz,
  delivered_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_shipments_order_id ON commerce.shipments (order_id);

CREATE TYPE commerce.refund_status AS ENUM ('initiated', 'processed', 'failed');

CREATE TABLE commerce.refunds (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           uuid NOT NULL REFERENCES commerce.orders(id),
  payment_id         uuid NOT NULL REFERENCES commerce.payments(id),
  razorpay_refund_id text,
  amount             numeric(10,2) NOT NULL,
  reason             text,
  status             commerce.refund_status NOT NULL DEFAULT 'initiated',
  created_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT refunds_amount_positive CHECK (amount > 0)
);
CREATE INDEX idx_refunds_order_id ON commerce.refunds (order_id);

-- Down Migration

DROP TABLE IF EXISTS commerce.refunds;
DROP TYPE IF EXISTS commerce.refund_status;
DROP TABLE IF EXISTS commerce.shipments;
DROP TYPE IF EXISTS commerce.shipment_status;
DROP TABLE IF EXISTS commerce.payments;
DROP TYPE IF EXISTS commerce.payment_status;
DROP TABLE IF EXISTS commerce.order_items;
DROP TABLE IF EXISTS commerce.orders;
DROP TYPE IF EXISTS commerce.order_status;
