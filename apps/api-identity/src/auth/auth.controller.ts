import { Body, Controller, Headers, HttpCode, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import type { LoginResponse, LogoutResponse, RegisterResponse } from "@pk-literature/contracts";
import { AuthService, type AuthResult } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { UnauthorizedProblem } from "../common/problem-details.exception";
import { JwtTokenService } from "./jwt.service";
import { REFRESH_TOKEN_MAX_AGE_MS } from "./session.service";

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

// SPEC-07 Security: "HTTP-only cookies, CSRF protection". Cookies are
// `httpOnly` (JS on the page can never read them, closing the main XSS
// token-theft vector) and `sameSite: "lax"` — a Lax cookie is withheld
// on cross-site POST/PATCH/DELETE requests by the browser itself,
// which is what actually stops CSRF here; a separate double-submit
// CSRF token was deliberately not added on top, since it would add
// real complexity (a token apps/web has to read and echo back on every
// mutating request) for a marginal gain once SameSite=Lax already
// blocks the cross-site-form-POST attack this is protecting against.
// `secure: true` means these cookies are dropped entirely over plain
// HTTP — fine in every deployed environment (API Gateway is HTTPS-only)
// but means local dev (main.ts, plain HTTP) never actually receives
// them back; local testing goes through the DB/service layer directly
// instead (see auth.service.spec.ts).
function cookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeMs,
  };
}

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly jwt: JwtTokenService,
  ) {}

  @Post("register")
  @HttpCode(201)
  async register(
    @Body() dto: RegisterDto,
    @Headers("x-anonymous-id") anonymousId: string | undefined,
    @Headers("user-agent") userAgent: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RegisterResponse> {
    const result = await this.auth.register(dto, anonymousId, userAgent);
    setAuthCookies(res, result, this.jwt.accessTokenMaxAgeMs);
    return result.user;
  }

  @Post("login")
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Headers("user-agent") userAgent: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const result = await this.auth.login(dto, userAgent);
    setAuthCookies(res, result, this.jwt.accessTokenMaxAgeMs);
    return result.user;
  }

  @Post("logout")
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<LogoutResponse> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    if (refreshToken) {
      await this.auth.logout(refreshToken);
    }
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/" });
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/" });
    return { loggedOut: true };
  }

  // Not one of SPEC-07's literally-enumerated APIs, but a necessary
  // consequence of taking its "Refresh token" session model seriously
  // — without an exchange endpoint, the 15-minute access-token cookie
  // would just expire with no way to renew it, making the refresh
  // token pointless. Same "reasonable, disclosed addition beyond the
  // literal spec list" precedent as api-commerce's FLAT_SHIPPING_COST.
  @Post("refresh")
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Headers("user-agent") userAgent: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ refreshed: true }> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedProblem("No refresh token presented.");
    }

    const rotated = await this.auth.refresh(refreshToken, userAgent);
    if (!rotated) {
      throw new UnauthorizedProblem("Refresh token is invalid, expired, or already used.");
    }

    res.cookie(ACCESS_TOKEN_COOKIE, rotated.accessToken, cookieOptions(this.jwt.accessTokenMaxAgeMs));
    res.cookie(REFRESH_TOKEN_COOKIE, rotated.session.refreshToken, cookieOptions(REFRESH_TOKEN_MAX_AGE_MS));
    return { refreshed: true };
  }
}

function setAuthCookies(res: Response, result: AuthResult, accessTokenMaxAgeMs: number): void {
  res.cookie(ACCESS_TOKEN_COOKIE, result.accessToken, cookieOptions(accessTokenMaxAgeMs));
  res.cookie(REFRESH_TOKEN_COOKIE, result.session.refreshToken, cookieOptions(REFRESH_TOKEN_MAX_AGE_MS));
}

export { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE };
