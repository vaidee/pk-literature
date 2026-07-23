import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health/health.controller";
import { CartModule } from "./cart/cart.module";
import { CheckoutModule } from "./checkout/checkout.module";
import { PaymentsModule } from "./payments/payments.module";
import { OrdersModule } from "./orders/orders.module";

// SPEC-06's Commerce API — cart/checkout/payments/orders. Anonymous
// checkout supported throughout (SPEC-06 Principles); Medusa
// (apps/medusa) is the admin surface over the same `commerce` schema,
// not something this Lambda calls into.
@Module({
  imports: [DatabaseModule, CartModule, CheckoutModule, PaymentsModule, OrdersModule],
  controllers: [HealthController],
})
export class AppModule {}
