import { NextResponse, type NextRequest } from "next/server";

// SPEC-07 Identity Model: "Anonymous Session -> Anonymous UUID -> ..."
// — the same X-Anonymous-Id every backend service (api-feed,
// api-search, api-commerce) already scopes anonymous data by.
// Provisioned once per browser here, in middleware, so every
// server-rendered page and every client-side fetch call downstream
// sees the same value from the very first request.
//
// Deliberately NOT httpOnly, unlike the access/refresh-token cookies
// apps/api-identity sets: this is a correlation id, not a credential
// (SPEC-07 draws the same line — "Secure cookie" for the anonymous
// session refers to the Secure flag over HTTPS, not JS-inaccessibility).
// Client Components (cart drawer, like button) read it directly via
// document.cookie to attach X-Anonymous-Id on their own fetch calls;
// making it httpOnly would require routing every one of those through
// a Next.js API-route proxy just to re-attach a non-secret header,
// which isn't worth the layer for what it protects here.
const ANONYMOUS_ID_COOKIE = "anonymous_id";

// Pre-launch placeholder: COMING_SOON_MODE is a plain Lambda runtime env
// var (terraform/environments/prod/web.tf), not a NEXT_PUBLIC_* build-time
// one — toggling it is a `terraform apply` away, no rebuild/redeploy of
// apps/web itself. Site-wide (every route rewrites to the same page)
// rather than home-page-only: there's no real inventory to browse to
// yet, so leaving search/cart/book-detail reachable would just surface
// an empty catalog.
const COMING_SOON_PATH = "/coming-soon";

export function middleware(request: NextRequest): NextResponse {
  if (process.env.COMING_SOON_MODE === "true" && request.nextUrl.pathname !== COMING_SOON_PATH) {
    return NextResponse.rewrite(new URL(COMING_SOON_PATH, request.url));
  }

  const response = NextResponse.next();

  if (!request.cookies.get(ANONYMOUS_ID_COOKIE)) {
    const anonymousId = crypto.randomUUID();
    response.cookies.set(ANONYMOUS_ID_COOKIE, anonymousId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year — "short-lived session" (SPEC-07) governs the auth cookies, not this correlation id
    });
    // So this same request's own Server Components can read the value
    // immediately via next/headers' cookies() — the response header
    // above only reaches the browser on the *next* request.
    request.cookies.set(ANONYMOUS_ID_COOKIE, anonymousId);
  }

  return response;
}

export const config = {
  matcher: [
    // Skip static assets and image optimization — no reason to run
    // this on every JS chunk request.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
