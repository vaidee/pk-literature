import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { JwtTokenService } from "./jwt.service";
import { UnauthorizedProblem } from "../common/problem-details.exception";
import { ACCESS_TOKEN_COOKIE } from "./auth.controller";

// Protects /profile and /addresses/* (SPEC-07 "Authorization:
// Authenticated APIs — Orders, Profile, Address Book"). Reads the
// access token from the httpOnly cookie first (the primary delivery
// mechanism, SPEC-07 Session Management) and falls back to an
// `Authorization: Bearer` header — useful for tooling/tests that don't
// carry a cookie jar, and a reasonable no-cost fallback since it's the
// same JWT either way, just a different transport.
declare module "express" {
  interface Request {
    userId?: string;
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = extractToken(req);
    if (!token) {
      throw new UnauthorizedProblem("Authentication required.");
    }

    const payload = this.jwt.verifyAccessToken(token);
    if (!payload) {
      throw new UnauthorizedProblem("Access token is invalid or expired.");
    }

    req.userId = payload.sub;
    return true;
  }
}

function extractToken(req: Request): string | undefined {
  const cookieToken = req.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }
  return undefined;
}
