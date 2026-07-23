import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

// JwtAuthGuard (auth/jwt-auth.guard.ts) attaches userId to the request
// after verifying the access token; every JWT-guarded route pulls it
// out this way rather than re-parsing the token in each controller.
export const CurrentUserId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<Request>();
  // Guaranteed set — this decorator is only ever used on routes behind
  // JwtAuthGuard, which throws before the handler runs if it's missing.
  return req.userId as string;
});
