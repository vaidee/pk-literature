import { Inject, Injectable } from "@nestjs/common";
import type { Kysely } from "kysely";
import type { Address, Order, OrderItem, OrderSummary } from "@pk-literature/domain-types";
import { KYSELY } from "../database/database.module";
import type { Database } from "../database/database.types";
import { NotFoundProblem, ValidationProblem } from "../common/problem-details.exception";
import type { PaginationDto } from "../common/pagination.dto";

@Injectable()
export class OrdersService {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async getById(orderId: string): Promise<Order> {
    const order = await this.db
      .selectFrom("commerce.orders")
      .select([
        "id",
        "orderNumber",
        "status",
        "subtotal",
        "shippingCost",
        "total",
        "currency",
        "shippingAddressId",
        "billingAddressId",
        "contactEmail",
        "contactPhone",
        "createdAt",
      ])
      .where("id", "=", orderId)
      .executeTakeFirst();
    if (!order) throw new NotFoundProblem("Order", orderId);

    const [items, shippingAddress, billingAddress] = await Promise.all([
      this.itemsFor(orderId),
      order.shippingAddressId ? this.addressById(order.shippingAddressId) : Promise.resolve(null),
      order.billingAddressId ? this.addressById(order.billingAddressId) : Promise.resolve(null),
    ]);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      items,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      currency: order.currency,
      shippingAddress,
      billingAddress,
      contactEmail: order.contactEmail,
      contactPhone: order.contactPhone,
      // Kysely infers this as ColumnType<Date, never, never> rather
      // than unwrapping to plain Date the way it does for other
      // Generated<ColumnType<...>> columns elsewhere in this repo —
      // the runtime value from `pg` is a real Date either way (this
      // is a TS inference gap, not a runtime one), so the cast is safe.
      createdAt: (order.createdAt as unknown as Date).toISOString(),
    };
  }

  /**
   * "My orders" for the anonymous-checkout case: orders don't carry
   * anonymous_id directly (there's no authenticated concept to scope
   * to yet, SPEC-07/Phase 7), but every order's cart_id traces back to
   * the cart that was checked out, and that cart does carry
   * anonymous_id — so the join is the scoping mechanism, not a
   * redundant duplicate column on orders.
   */
  async list(anonymousId: string | undefined, pagination: PaginationDto): Promise<{ items: OrderSummary[]; totalItems: number }> {
    if (!anonymousId) {
      throw new ValidationProblem("X-Anonymous-Id header is required to list orders.");
    }

    const [rows, countRow] = await Promise.all([
      this.db
        .selectFrom("commerce.orders")
        .innerJoin("commerce.cart", "commerce.cart.id", "commerce.orders.cartId")
        .select([
          "commerce.orders.id",
          "commerce.orders.orderNumber",
          "commerce.orders.status",
          "commerce.orders.total",
          "commerce.orders.currency",
          "commerce.orders.createdAt",
        ])
        .where("commerce.cart.anonymousId", "=", anonymousId)
        .orderBy("commerce.orders.createdAt", "desc")
        .limit(pagination.pageSize)
        .offset(pagination.offset)
        .execute(),
      this.db
        .selectFrom("commerce.orders")
        .innerJoin("commerce.cart", "commerce.cart.id", "commerce.orders.cartId")
        .select((eb) => eb.fn.countAll<string>().as("count"))
        .where("commerce.cart.anonymousId", "=", anonymousId)
        .executeTakeFirstOrThrow(),
    ]);

    const items: OrderSummary[] = rows.map((row) => ({
      id: row.id,
      orderNumber: row.orderNumber,
      status: row.status,
      total: Number(row.total),
      currency: row.currency,
      createdAt: (row.createdAt as unknown as Date).toISOString(),
    }));

    return { items, totalItems: Number(countRow.count) };
  }

  private async itemsFor(orderId: string): Promise<OrderItem[]> {
    const rows = await this.db
      .selectFrom("commerce.orderItems")
      .selectAll()
      .where("orderId", "=", orderId)
      .execute();
    return rows.map((row) => ({
      id: row.id,
      bookId: row.bookId,
      titleSnapshot: row.titleSnapshot,
      unitPrice: Number(row.unitPrice),
      currency: row.currency,
      quantity: row.quantity,
    }));
  }

  private async addressById(addressId: string): Promise<Address> {
    const row = await this.db
      .selectFrom("commerce.addresses")
      .selectAll()
      .where("id", "=", addressId)
      .executeTakeFirstOrThrow();
    return {
      id: row.id,
      recipientName: row.recipientName,
      line1: row.line1,
      line2: row.line2,
      city: row.city,
      state: row.state,
      postalCode: row.postalCode,
      country: row.country,
      phone: row.phone,
    };
  }
}
