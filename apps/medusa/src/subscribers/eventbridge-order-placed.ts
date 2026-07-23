import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

// Demonstrates the same "Medusa admin action -> EventBridge PutEvents"
// wiring apps/directus's eventbridge-put-event Flow operation uses for
// SPEC-03 (a real extension, not the sandboxed Flows "Run Script"
// operation, so it gets the ECS task role's real AWS credentials —
// terraform/environments/<env>/medusa.tf's aws_iam_policy_document
// grants ecs-medusa events:PutEvents the same way ecs-directus gets
// it). It is intentionally scoped to Medusa's own built-in
// `order.placed` event (a stable, documented Medusa v2 event) rather
// than SPEC-06's OrderShipped/RefundIssued — this Medusa deployment
// runs its own default order/customer data model in the `medusa`
// schema, not apps/api-commerce's `commerce.orders` (see
// ../../README.md's "Scope boundary" section for why), so there is no
// real order here for a shipment/refund action to fire against yet.
// Once a custom Medusa module maps admin actions onto commerce.orders,
// this file is the pattern to extend for OrderShipped/RefundIssued.
//
// Written against Medusa v2's documented subscriber shape
// (SubscriberArgs/SubscriberConfig, config.event, default export
// handler) but — like every file in this app — not run against a live
// Medusa instance in this sandbox; see ../../README.md.
const client = new EventBridgeClient({});

export default async function orderPlacedHandler({ event: { data }, container }: SubscriberArgs<{ id: string }>): Promise<void> {
  const logger = container.resolve("logger");
  const busName = process.env.EVENTBRIDGE_BUS_NAME;
  if (!busName) {
    logger.warn("EVENTBRIDGE_BUS_NAME is not configured — skipping PutEvents");
    return;
  }

  await client.send(
    new PutEventsCommand({
      Entries: [
        {
          EventBusName: busName,
          Source: "pk-literature.medusa",
          DetailType: "MedusaOrderPlaced",
          Detail: JSON.stringify({ medusaOrderId: data.id }),
        },
      ],
    }),
  );
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
