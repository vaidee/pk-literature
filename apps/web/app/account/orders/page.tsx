import Link from "next/link";
import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/api/server-fetch";
import { getProfile } from "@/lib/api/identity";
import { listOrders } from "@/lib/api/commerce";
import { ApiError } from "@/lib/api/problem-details";

// KNOWN LIMITATION — see apps/web/README.md's "Scope boundary" section
// for the full explanation. apps/api-commerce's GET /orders (built in
// Phase 6, before Identity/Phase 7 existed) scopes results by the
// X-Anonymous-Id header only; it has no concept of an authenticated
// customerId anywhere in its cart/checkout/orders code. This page
// still gates on login (redirects if the caller isn't authenticated,
// which is the right product behavior), but the order list it then
// shows is whatever's tied to *this browser's* anonymous-cart lineage
// — not a true "this account's orders across every device" list.
// Fixing that for real means apps/api-commerce verifying the access-
// token JWT and querying by commerce.orders.customerId, which is real,
// separate backend work, not something this frontend change can paper
// over.
export default async function OrdersPage() {
  await requireLogin();
  const result = await listOrders(serverFetch);

  if (result.items.length === 0) {
    return <p className="text-muted-foreground">You have no orders yet.</p>;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-bold">Order history</h1>
      <div className="flex flex-col divide-y divide-border">
        {result.items.map((order) => (
          <Link key={order.id} href={`/account/orders/${order.id}`} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">{order.orderNumber}</p>
              <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm capitalize">{order.status.replace("_", " ")}</p>
              <p className="font-medium">
                {order.currency} {order.total.toFixed(2)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

async function requireLogin(): Promise<void> {
  try {
    await getProfile(serverFetch);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/login");
    throw err;
  }
}
