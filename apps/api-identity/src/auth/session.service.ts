import { createHash, randomBytes } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import type { Kysely } from "kysely";
import { KYSELY } from "../database/database.module";
import type { Database } from "../database/database.types";

// SPEC-07 "Registered: ... Refresh token, Secure HTTP-only cookies" —
// the refresh token itself is a high-entropy random value, never a
// JWT (it carries no claims, it's purely a lookup key); only its
// SHA-256 hash is ever persisted (identity.sessions.refresh_token_hash),
// same "never store the credential itself" reasoning as password_hash.
const REFRESH_TOKEN_BYTES = 32;
export const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface CreatedSession {
  refreshToken: string;
  sessionId: string;
  expiresAt: Date;
}

@Injectable()
export class SessionService {
  constructor(@Inject(KYSELY) private readonly db: Kysely<Database>) {}

  async createSession(userId: string, userAgent: string | undefined): Promise<CreatedSession> {
    const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);

    const row = await this.db
      .insertInto("identity.sessions")
      .values({
        userId,
        refreshTokenHash: hashToken(refreshToken),
        userAgent: userAgent ?? null,
        expiresAt,
      })
      .returning("id")
      .executeTakeFirstOrThrow();

    return { refreshToken, sessionId: row.id, expiresAt };
  }

  /**
   * Validates a presented refresh token and, if valid, rotates it:
   * revokes the old session and creates a fresh one. Rotation on every
   * use means a stolen-then-replayed refresh token is only ever usable
   * once before the legitimate holder's next refresh invalidates it —
   * standard refresh-token-rotation practice, not specified literally
   * in SPEC-07 but a direct consequence of taking "Refresh token"
   * seriously as a security mechanism, not just a longer-lived JWT.
   */
  async rotateSession(presentedToken: string, userAgent: string | undefined): Promise<CreatedSession | null> {
    const tokenHash = hashToken(presentedToken);
    const session = await this.db
      .selectFrom("identity.sessions")
      .select(["id", "userId", "expiresAt", "revokedAt"])
      .where("refreshTokenHash", "=", tokenHash)
      .executeTakeFirst();

    if (!session || session.revokedAt || new Date(session.expiresAt) < new Date()) {
      return null;
    }

    await this.db.updateTable("identity.sessions").set({ revokedAt: new Date() }).where("id", "=", session.id).execute();

    const next = await this.createSession(session.userId, userAgent);
    return next;
  }

  async revokeByToken(presentedToken: string): Promise<void> {
    await this.db
      .updateTable("identity.sessions")
      .set({ revokedAt: new Date() })
      .where("refreshTokenHash", "=", hashToken(presentedToken))
      .execute();
  }

  async userIdForValidToken(presentedToken: string): Promise<string | null> {
    const session = await this.db
      .selectFrom("identity.sessions")
      .select(["userId", "expiresAt", "revokedAt"])
      .where("refreshTokenHash", "=", hashToken(presentedToken))
      .executeTakeFirst();

    if (!session || session.revokedAt || new Date(session.expiresAt) < new Date()) {
      return null;
    }
    return session.userId;
  }
}
