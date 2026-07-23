// Shared shape between server-fetch.ts and client-fetch.ts — every
// function in catalog.ts/feed.ts/search.ts/commerce.ts/identity.ts
// takes one of these as its first argument instead of being written
// twice (once per environment), since the only real difference
// between the two is how cookies get attached, not the request shape.
export type Fetcher = <T>(path: string, init?: RequestInit) => Promise<T>;

export function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
