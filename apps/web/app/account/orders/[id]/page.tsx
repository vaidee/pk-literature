import { notFound, redirect } from "next/navigation";
import { serverFetch } from "@/lib/api/server-fetch";
import { getProfile } from "@/lib/api/identity";
import { getOrder } from "@/lib/api/commerce";
import { ApiError } from "@/lib/api/problem-details";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireLogin();
  const { id } = await params;
  const order = await getOrderOr404(id);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
        <p className="text-muted-foreground capitalize">{order.status.replace("_", " ")}</p>
      </div>

      <ul className="flex flex-col divide-y divide-border">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between py-2 text-sm">
            <span>
              {item.titleSnapshot} &times; {item.quantity}
            </span>
            <span>
              {item.currency} {(item.unitPrice * item.quantity).toFixed(2)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex justify-between border-t border-border pt-2 font-semibold">
        <span>Total</span>
        <span>
          {order.currency} {order.total.toFixed(2)}
        </span>
      </div>

      {order.shippingAddress && (
        <div className="text-sm">
          <h2 className="mb-1 font-semibold">Shipping to</h2>
          <p>{order.shippingAddress.recipientName}</p>
          <p>{order.shippingAddress.line1}</p>
          {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
          <p>
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
          </p>
        </div>
      )}
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

async function getOrderOr404(id: string) {
  try {
    return await getOrder(serverFetch, id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
}
