import { Inject, Injectable } from "@nestjs/common";
import type { Kysely } from "kysely";
import type { User } from "@pk-literature/domain-types";
import type { UserRegisteredEvent } from "@pk-literature/contracts";
import { KYSELY } from "../database/database.module";
import type { Database } from "../database/database.types";
import { ValidationProblem, UnauthorizedProblem } from "../common/problem-details.exception";
import { EventBridgeService } from "../common/eventbridge.service";
import { toUser } from "../common/to-user";
import { PasswordService } from "./password.service";
import { JwtTokenService } from "./jwt.service";
import { SessionService, type CreatedSession } from "./session.service";
import type { RegisterDto } from "./dto/register.dto";
import type { LoginDto } from "./dto/login.dto";

export interface AuthResult {
  user: User;
  accessToken: string;
  session: CreatedSession;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(KYSELY) private readonly db: Kysely<Database>,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtTokenService,
    private readonly sessions: SessionService,
    private readonly events: EventBridgeService,
  ) {}

  async register(dto: RegisterDto, anonymousId: string | undefined, userAgent: string | undefined): Promise<AuthResult> {
    const existing = await this.db
      .selectFrom("identity.users")
      .select("id")
      .where("email", "=", dto.email)
      .executeTakeFirst();
    if (existing) {
      throw new ValidationProblem(`An account already exists for ${dto.email}.`);
    }

    const passwordHash = await this.passwords.hash(dto.password);

    const user = await this.db.transaction().execute(async (trx) => {
      const row = await trx
        .insertInto("identity.users")
        .values({
          email: dto.email,
          passwordHash,
          displayName: dto.displayName,
          phone: dto.phone ?? null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx.insertInto("identity.profilePreferences").values({ userId: row.id }).execute();

      // SPEC-07 "Do not duplicate events" — marking merged_at here
      // (inside the same transaction as user creation) means a retried
      // /auth/register request that somehow got this far can't record
      // the merge twice; the anonymous_profiles row either doesn't
      // exist yet (first-ever request from this anonymous_id) or
      // already has merged_at set (nothing left to do).
      if (anonymousId) {
        await trx
          .insertInto("identity.anonymousProfiles")
          .values({ anonymousId, mergedIntoUserId: row.id, mergedAt: new Date() })
          .onConflict((oc) =>
            oc.column("anonymousId").doUpdateSet({ mergedIntoUserId: row.id, mergedAt: new Date() }),
          )
          .execute();
      }

      return row;
    });

    const session = await this.sessions.createSession(user.id, userAgent);
    const accessToken = this.jwt.signAccessToken({ sub: user.id, email: user.email });

    const event: UserRegisteredEvent = { userId: user.id, email: user.email, anonymousId: anonymousId ?? null };
    await this.events.publish("UserRegistered", event);

    return { user: toUser(user), accessToken, session };
  }

  async login(dto: LoginDto, userAgent: string | undefined): Promise<AuthResult> {
    const row = await this.db
      .selectFrom("identity.users")
      .selectAll()
      .where("email", "=", dto.email)
      .executeTakeFirst();

    // Same "invalid credentials" message whether the email doesn't
    // exist or the password doesn't match — distinguishing the two
    // would let a caller enumerate registered emails.
    if (!row || !row.passwordHash || !(await this.passwords.verify(dto.password, row.passwordHash))) {
      throw new UnauthorizedProblem("Invalid email or password.");
    }

    const session = await this.sessions.createSession(row.id, userAgent);
    const accessToken = this.jwt.signAccessToken({ sub: row.id, email: row.email });

    return { user: toUser(row), accessToken, session };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.sessions.revokeByToken(refreshToken);
  }

  async refresh(refreshToken: string, userAgent: string | undefined): Promise<{ accessToken: string; session: CreatedSession } | null> {
    const rotated = await this.sessions.rotateSession(refreshToken, userAgent);
    if (!rotated) return null;

    // rotateSession doesn't return the user's email directly — fetch
    // it via the session's userId instead of threading email through
    // SessionService (which has no reason to know about users beyond
    // their id).
    const owner = await this.db
      .selectFrom("identity.sessions")
      .innerJoin("identity.users", "identity.users.id", "identity.sessions.userId")
      .select(["identity.users.id as userId", "identity.users.email as email"])
      .where("identity.sessions.id", "=", rotated.sessionId)
      .executeTakeFirstOrThrow();

    const accessToken = this.jwt.signAccessToken({ sub: owner.userId, email: owner.email });
    return { accessToken, session: rotated };
  }
}
