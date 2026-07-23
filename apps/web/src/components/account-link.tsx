import Link from "next/link";
import { serverFetch } from "@/lib/api/server-fetch";
import { getProfile } from "@/lib/api/identity";

// Server Component — a 401 (no/expired access-token cookie) just means
// "not logged in," not an error; every other failure is treated the
// same way (fall back to the logged-out link) rather than crashing
// the header.
export async function AccountLink() {
  const displayName = await getDisplayNameSafely();

  if (displayName) {
    return (
      <Link href="/account" className="font-medium">
        {displayName}
      </Link>
    );
  }

  return (
    <Link href="/login" className="font-medium">
      Sign in
    </Link>
  );
}

async function getDisplayNameSafely(): Promise<string | null> {
  try {
    const profile = await getProfile(serverFetch);
    return profile.displayName;
  } catch {
    return null;
  }
}
