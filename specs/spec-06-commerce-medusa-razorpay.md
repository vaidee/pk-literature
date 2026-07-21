# SPEC-06 --- Commerce (Medusa + Razorpay)

Version: 1.0 Status: Draft

## Purpose

Provide a lightweight, scalable commerce platform integrated with the
catalog while keeping commerce isolated from editorial content.

Commerce owns carts, checkout, orders, payments and fulfillment.

------------------------------------------------------------------------

# Principles

-   Anonymous checkout supported
-   Catalog remains external
-   Medusa used for order operations only
-   Razorpay is the payment gateway
-   Idempotent payment processing

------------------------------------------------------------------------

# Scope

Owns:

-   Cart
-   Checkout
-   Orders
-   Customers
-   Addresses
-   Payments
-   Shipments
-   Refunds

Does Not Own:

-   Books
-   Authors
-   Publishers
-   Themes
-   Editorial metadata

------------------------------------------------------------------------

# Architecture

Website

↓

Commerce API

↓

Razorpay

↓

Webhook

↓

Commerce Service

↓

Medusa Admin

------------------------------------------------------------------------

# Cart

Supports:

-   Anonymous cart
-   Logged-in cart
-   Cart merge on login

Cart Items:

-   book_id
-   title snapshot
-   unit_price
-   quantity

------------------------------------------------------------------------

# Checkout Flow

Book

↓

Add to Cart

↓

Review Cart

↓

Shipping Address

↓

Create Razorpay Order

↓

Payment

↓

Webhook Verification

↓

Order Created

↓

Confirmation

------------------------------------------------------------------------

# Order Lifecycle

Draft

↓

Pending Payment

↓

Paid

↓

Packed

↓

Shipped

↓

Delivered

↓

Completed

Alternative:

Cancelled

Refunded

Returned

------------------------------------------------------------------------

# Payment

Razorpay creates payment order.

Webhook verification is mandatory before marking an order Paid.

Browser callbacks are advisory only.

------------------------------------------------------------------------

# Medusa Responsibilities

-   Order management
-   Customer management
-   Shipment status
-   Refunds
-   Admin UI

No catalog ownership.

------------------------------------------------------------------------

# APIs

POST /cart

GET /cart

PATCH /cart/items

DELETE /cart/items/{id}

POST /checkout

POST /payments/create-order

POST /payments/webhook

GET /orders

GET /orders/{id}

------------------------------------------------------------------------

# Database

commerce schema

Tables

-   cart
-   cart_items
-   orders
-   order_items
-   customers
-   addresses
-   payments
-   shipments
-   refunds

------------------------------------------------------------------------

# Events

Publishes

OrderCreated

OrderPaid

OrderCancelled

OrderShipped

RefundIssued

Consumes

InventoryUpdated

PaymentSucceeded

PaymentFailed

------------------------------------------------------------------------

# Inventory

Checkout validates inventory before payment.

Inventory ownership remains in Catalog.

Commerce stores only a purchase snapshot.

------------------------------------------------------------------------

# Notifications

Future:

-   Email confirmation
-   SMS
-   WhatsApp
-   Shipping updates

------------------------------------------------------------------------

# Security

-   HTTPS
-   Webhook signature verification
-   Idempotency keys
-   PCI compliance delegated to Razorpay

------------------------------------------------------------------------

# Acceptance Criteria

-   Anonymous users can purchase.
-   Razorpay webhook finalizes payments.
-   Medusa manages orders only.
-   Catalog remains the system of record.
-   Order history is auditable.
