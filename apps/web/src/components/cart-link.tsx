import Link from "next/link";
import { serverFetch } from "@/lib/api/server-fetch";
import { getCart } from "@/lib/api/commerce";

// Server Component — reads the cart fresh on every navigation (see
// server-fetch.ts's cache: "no-store"). Deliberately swallows a fetch
// failure rather than crashing the whole layout: apps/api-commerce
// being briefly unreachable shouldn't take down every page on the
// site, just this one badge.
export async function CartLink() {
  const itemCount = await getItemCountSafely();

  return (
    <Link href="/cart" className="font-medium">
      Cart{itemCount > 0 ? ` (${itemCount})` : ""}
    </Link>
  );
}

async function getItemCountSafely(): Promise<number> {
  try {
    const cart = await getCart(serverFetch);
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  } catch {
    return 0;
  }
}
