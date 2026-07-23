import serverlessExpress from "@codegenie/serverless-express";
import type { Handler } from "aws-lambda";
import { createApp } from "./create-app";

// Deployed entry point — API Gateway (HTTP API, payload format v2,
// terraform/modules/api-gateway) invokes this. Public, unauthenticated
// routes (terraform/environments/<env>/api-search.tf) — same "Discovery
// reads are public" reasoning as api-feed (SPEC-16).
//
// The NestJS app is built once per Lambda execution environment (cold
// start) and reused across warm invocations — rebuilding it per request
// would rebuild the whole DI graph, including the Kysely/pg Pool, on
// every call.
let cachedHandler: Handler;

export const handler: Handler = async (event, context, callback) => {
  if (!cachedHandler) {
    const app = await createApp();
    await app.init();
    cachedHandler = serverlessExpress({ app: app.getHttpAdapter().getInstance() });
  }
  return cachedHandler(event, context, callback);
};
