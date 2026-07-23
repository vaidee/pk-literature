# api-identity

SPEC-07's User & Identity API: registration, login/logout, JWT session
management, profile, and address book. See `plan/database/ddl/identity.sql`
for the schema design rationale.

## Session design

- **Access token**: a short-lived (15 min) JWT (`auth/jwt.service.ts`),
  signed with a single HS256 secret (`identity/jwt-signing-secret` in
  Secrets Manager). Delivered as an `httpOnly`, `secure`, `sameSite=lax`
  cookie — never in a JSON response body (see `packages/contracts/src/identity-api.ts`'s
  header comment).
- **Refresh token**: a high-entropy random value (not a JWT — it carries
  no claims, it's purely a lookup key), hashed with SHA-256 before
  storage in `identity.sessions`. Rotated on every use
  (`auth/session.service.ts`'s `rotateSession`): the old session is
  revoked and a new one issued, so a stolen-then-replayed refresh token
  is only usable once before the legitimate holder's next refresh
  invalidates it.
- **`POST /auth/refresh`**: not one of SPEC-07's literally-enumerated
  APIs, but a necessary consequence of taking its "Refresh token"
  session model seriously — without an exchange endpoint, the
  15-minute access-token cookie would just expire with no way to renew
  it. Same "reasonable, disclosed addition beyond the literal spec
  list" precedent as `apps/api-commerce`'s flat shipping cost.
- **CSRF**: `sameSite=lax` cookies are the actual protection mechanism
  (SPEC-07 Security: "CSRF protection") — a Lax cookie is withheld by
  the browser on cross-site POST/PATCH/DELETE requests, which is what
  stops the classic cross-site-form-POST CSRF attack. A separate
  double-submit CSRF token was deliberately not added on top of that;
  see `auth/auth.controller.ts`'s header comment for the full
  reasoning.

## Passwordless-ready, not passwordless

SPEC-07 lists Email+OTP/Google/Apple as "(future)" authentication
methods alongside today's email+password. `identity.users.password_hash`
is nullable specifically so a future OTP-only or OAuth-only account is
representable without inventing a dummy password — but the only
registration path implemented today (`POST /auth/register`) always
sets one; there is no OTP or OAuth flow in this pass.

## Anonymous merge — cart only

SPEC-07's "Anonymous Merge" lists Likes, Interest profile, Cart, and
Preferences. This phase implements one of those for real:

- **Cart** — `POST /auth/register` publishes a `UserRegistered` event
  (best-effort, EventBridge); `apps/api-commerce`'s
  `eventbridge-handler.ts` (a second Lambda entry point, invoked
  directly by an EventBridge rule — the first real event *consumer* in
  this repo, every prior phase only ever published) creates a
  `commerce.customers` row keyed by the same id as `identity.users.id`
  and reassigns the caller's active anonymous cart to it. Verified
  end-to-end against real local Postgres, including redelivery
  idempotency (see the PR description for what was exercised).

**Likes and interest profile are not merged** — `discovery.interest_events`/
`discovery.anonymous_profiles` are owned by `apps/api-feed`, and wiring
a second `UserRegistered` consumer there (re-keying past likes and
interest-profile rows from `anonymous_id` to the new `user_id`) is a
disclosed follow-up, not built in this pass. This is the same category
of deliberate scope boundary as `apps/medusa/README.md`'s "Medusa does
not read/write `commerce.*`" section — the event contract
(`UserRegisteredEvent`, `plan/contracts/events/UserRegistered.schema.json`)
already carries everything a future `api-feed` consumer would need
(`userId`, `anonymousId`); only the consumer itself is missing.
Preferences (`identity.profile_preferences`) don't need a merge at all
— they're created fresh at registration time, there's no anonymous-side
preferences table to merge from.

## Not implemented

- Google/Apple OAuth, email OTP (SPEC-07 lists all three as "(future)").
- MFA (SPEC-07 Security: "MFA support (future)").
- Rate limiting on `/auth/*` (SPEC-07 Security lists it; this repo has
  no API-Gateway-level rate limiting or WAF wired up anywhere yet, not
  just here — a cross-cutting gap, not specific to this service).
