import type { EventBridgeEvent, Handler } from "aws-lambda";
import type { UserRegisteredEvent } from "@pk-literature/contracts";
import { createKysely } from "./database/database.module";
import { CustomersService } from "./customers/customers.service";

// A second, separate Lambda entry point from src/lambda.ts — EventBridge
// invokes this one directly (terraform/environments/<env>/api-commerce.tf's
// aws_cloudwatch_event_rule/aws_lambda_permission), not via API Gateway,
// so there's no serverless-express/NestJS HTTP bootstrap here at all.
// The one thing it does — SPEC-07's "Anonymous Merge: ... Cart" —
// doesn't need a DI container; CustomersService is instantiated
// directly with a real Kysely connection, same as this repo's own
// scratch smoke tests do.
//
// Cold-start-cached like src/lambda.ts, for the same reason (a fresh
// Pool per invocation would exhaust RDS Proxy connections under load).
let db: ReturnType<typeof createKysely> | undefined;

export const handler: Handler<EventBridgeEvent<"UserRegistered", UserRegisteredEvent>> = async (event) => {
  if (!db) {
    db = createKysely();
  }

  const customers = new CustomersService(db);
  const { userId, email, anonymousId } = event.detail;
  await customers.mergeAnonymousCart(userId, email, anonymousId);
};
