import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { ProblemDetailsFilter } from "./common/problem-details.filter";

// Shared by both entry points (main.ts for local dev, lambda.ts for
// the deployed handler) so they can never drift on global pipes/filters.
export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ["error", "warn", "log"],
    // POST /payments/webhook needs the exact raw request bytes to
    // verify Razorpay's HMAC signature (razorpay-signature.ts) — the
    // parsed/re-serialized JSON body is not guaranteed to be
    // byte-identical to what Razorpay actually signed. `rawBody: true`
    // makes Nest's built-in body parser stash the raw Buffer on
    // `req.rawBody` for every route, not just this one, which is
    // harmless for the others (they never read it).
    rawBody: true,
  });

  app.setGlobalPrefix("v1");
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new ProblemDetailsFilter());

  return app;
}
