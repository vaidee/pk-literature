import { z } from "zod";
import { MediaAssetSchema } from "./media-asset";

// SPEC-06's Cart Items: "book_id, title snapshot, unit_price,
// quantity" — `cover` is the one addition beyond that literal list,
// resolved at read time (never stored) purely so the cart UI can show
// a thumbnail without a second round trip to Catalog.
export const CartItemSchema = z.object({
  id: z.string().uuid(),
  bookId: z.string().uuid(),
  titleSnapshot: z.string(),
  unitPrice: z.number(),
  currency: z.string().length(3),
  quantity: z.number().int().positive(),
  cover: MediaAssetSchema.nullable(),
});
export type CartItem = z.infer<typeof CartItemSchema>;

export const CartSchema = z.object({
  id: z.string().uuid(),
  items: z.array(CartItemSchema),
  subtotal: z.number(),
  currency: z.string().length(3),
});
export type Cart = z.infer<typeof CartSchema>;

export const AddressSchema = z.object({
  id: z.string().uuid().optional(),
  recipientName: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().nullable(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().length(2).default("IN"),
  phone: z.string().min(1),
});
export type Address = z.infer<typeof AddressSchema>;

// Mirrors commerce.order_status (plan/database/ddl/commerce.sql).
export const OrderStatusSchema = z.enum([
  "draft",
  "pending_payment",
  "paid",
  "packed",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
  "refunded",
  "returned",
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  bookId: z.string().uuid(),
  titleSnapshot: z.string(),
  unitPrice: z.number(),
  currency: z.string().length(3),
  quantity: z.number().int().positive(),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  status: OrderStatusSchema,
  items: z.array(OrderItemSchema),
  subtotal: z.number(),
  shippingCost: z.number(),
  total: z.number(),
  currency: z.string().length(3),
  shippingAddress: AddressSchema.nullable(),
  billingAddress: AddressSchema.nullable(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  createdAt: z.string(),
});
export type Order = z.infer<typeof OrderSchema>;

// Lighter shape for GET /orders list view.
export const OrderSummarySchema = OrderSchema.pick({
  id: true,
  orderNumber: true,
  status: true,
  total: true,
  currency: true,
  createdAt: true,
});
export type OrderSummary = z.infer<typeof OrderSummarySchema>;
