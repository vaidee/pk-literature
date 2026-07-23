import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { ProblemDetailsFilter } from "./common/problem-details.filter";

// Shared by both entry points (main.ts for local dev, lambda.ts for
// the deployed handler) so they can never drift on global pipes/filters.
export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ["error", "warn", "log"],
  });

  // SPEC-07 "Session Management": access/refresh tokens travel as
  // secure HTTP-only cookies, not JSON body fields (mitigates token
  // theft via XSS) — auth.controller.ts reads/sets them via
  // `req.cookies`/`res.cookie`, which needs this parser registered.
  app.use(cookieParser());

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
