import serverlessExpress from "@codegenie/serverless-express";
import type { Handler } from "aws-lambda";
import { createApp } from "./create-app";
import { resolveSecretEnvVars } from "./common/resolve-secret-env-vars";

// Deployed entry point — API Gateway (HTTP API, payload format v2,
// terraform/modules/api-gateway) invokes this. Private-nat subnet tier
// (terraform/environments/<env>/api-commerce.tf) — the one Lambda in
// this repo besides Medusa's ECS task that needs real internet egress,
// to reach Razorpay (ADR-009's consequences: "NAT Gateway tier: shrinks
// to {commerce, Medusa}"). Public API Gateway routes, no auth — same
// "no anonymous-session auth mechanism until SPEC-07 lands" reasoning
// as api-feed/api-search, extended to cart/checkout/payments here too.
//
// The NestJS app is built once per Lambda execution environment (cold
// start) and reused across warm invocations — rebuilding it per request
// would rebuild the whole DI graph, including the Kysely/pg Pool, on
// every call. Secrets are resolved from Secrets Manager ARNs into plain
// RAZORPAY_* env vars once here too, before the app (and the
// RazorpayClient field initializers that read them) is built.
let cachedHandler: Handler;

export const handler: Handler = async (event, context, callback) => {
  if (!cachedHandler) {
    await resolveSecretEnvVars();
    const app = await createApp();
    await app.init();
    cachedHandler = serverlessExpress({ app: app.getHttpAdapter().getInstance() });
  }
  return cachedHandler(event, context, callback);
};
