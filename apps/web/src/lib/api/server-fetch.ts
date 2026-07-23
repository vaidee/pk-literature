import "server-only";
import { cookies } from "next/headers";
import { throwIfProblem } from "./problem-details";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";

/**
 * Server Components can't rely on the browser to attach cookies the
 * way a client-side `fetch(..., { credentials: "include" })` can —
 * Node's fetch has no cookie jar of its own — so this reads the
 * inbound request's cookies via `next/headers` and forwards them
 * explicitly as a `Cookie` header. That's what lets an SSR'd
 * /account page authenticate as the logged-in user, and what lets
 * every SSR'd page (feed, search, cart) scope anonymous data by the
 * same X-Anonymous-Id middleware.ts already provisioned.
 */
export async function serverFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies();
  const anonymousId = cookieStore.get("anonymous_id")?.value;
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(anonymousId && { "x-anonymous-id": anonymousId }),
      ...(cookieHeader && { cookie: cookieHeader }),
      ...init?.headers,
    },
    // Every page here reads live per-request state (cart, auth,
    // personalized feed ranking) — see apps/web/README.md's "Scope
    // boundary" on why nothing here opts into Next's fetch cache.
    cache: "no-store",
  });

  await throwIfProblem(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
