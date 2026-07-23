import serverlessExpress from "@codegenie/serverless-express";
import type { Handler } from "aws-lambda";
import { createApp } from "./create-app";
import { resolveSecretEnvVars } from "./common/resolve-secret-env-vars";

// Deployed entry point — API Gateway (HTTP API, payload format v2,
// terraform/modules/api-gateway) invokes this. private-isolated subnet
// tier (terraform/environments/<env>/api-identity.tf,
// infrastructure/networking.md) — unlike api-commerce/Medusa, nothing
// this service does needs internet egress (no third-party API calls),
// so it stays NAT-free like api-catalog/api-feed/api-search. Public API
// Gateway routes — POST /auth/register and /auth/login are necessarily
// public (that's how a caller gets a token in the first place);
// /profile and /addresses/* are protected by JwtAuthGuard instead of
// API-Gateway-level auth.
//
// The NestJS app is built once per Lambda execution environment (cold
// start) and reused across warm invocations. The JWT signing secret is
// resolved from its Secrets Manager ARN once here too, before the app
// (and the JwtService/AuthService that read it) is built.
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
