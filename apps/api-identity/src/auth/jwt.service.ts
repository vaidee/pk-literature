import { Injectable } from "@nestjs/common";
import jwt from "jsonwebtoken";

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
}

// A thin wrapper over `jsonwebtoken`, not Nest's own @nestjs/jwt
// package — the access token is the only JWT this service ever
// issues/verifies, so pulling in a whole module for two function calls
// isn't worth it (same "hand-roll the thin wrapper" call as
// apps/api-commerce/src/payments/razorpay-signature.ts over a full
// Razorpay SDK).
@Injectable()
export class JwtTokenService {
  private readonly secret = process.env.JWT_SIGNING_SECRET ?? "";
  // 15 minutes — short-lived by design (SPEC-07 "Registered: JWT access
  // token, Refresh token"); the refresh token (session.service.ts) is
  // what makes a 15-minute token tolerable for a logged-in user.
  private readonly expiresInSeconds = 15 * 60;

  signAccessToken(payload: AccessTokenPayload): string {
    if (!this.secret) throw new Error("JWT_SIGNING_SECRET is not configured");
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresInSeconds });
  }

  verifyAccessToken(token: string): AccessTokenPayload | null {
    if (!this.secret) throw new Error("JWT_SIGNING_SECRET is not configured");
    try {
      return jwt.verify(token, this.secret) as AccessTokenPayload;
    } catch {
      return null;
    }
  }

  get accessTokenMaxAgeMs(): number {
    return this.expiresInSeconds * 1000;
  }
}
