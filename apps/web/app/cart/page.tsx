"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Cart } from "@pk-literature/domain-types";
import { Button } from "@pk-literature/ui";
import { clientFetch } from "@/lib/api/client-fetch";
import { getOrCreateCart, removeCartItem, upsertCartItem } from "@/lib/api/commerce";
import { ApiError } from "@/lib/api/problem-details";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  useEffect(() => {
    getOrCreateCart(clientFetch)
      .then(setCart)
      .catch((err) => setError(err instanceof ApiError ? (err.problem.detail ?? err.message) : "Could not load cart."));
  }, []);

  async function changeQuantity(item: Cart["items"][number], quantity: number) {
    if (quantity < 1) return;
    setPendingItemId(item.id);
    try {
      const updated = await upsertCartItem(clientFetch, { bookId: item.bookId, quantity });
      setCart(updated);
      router.refresh(); // re-runs CartLink's server-side item count
    } catch (err) {
      setError(err instanceof ApiError ? (err.problem.detail ?? err.message) : "Could not update quantity.");
    } finally {
      setPendingItemId(null);
    }
  }

  async function remove(item: Cart["items"][number]) {
    setPendingItemId(item.id);
    try {
      const updated = await removeCartItem(clientFetch, item.id);
      setCart(updated);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? (err.problem.detail ?? err.message) : "Could not remove item.");
    } finally {
      setPendingItemId(null);
    }
  }

  if (error) return <p className="text-destructive">{error}</p>;
  if (!cart) return <p className="text-muted-foreground">Loading cart...</p>;

  if (cart.items.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Link href="/" className="mt-4 inline-block underline">
          Browse books
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Your Cart</h1>

      <div className="flex flex-col divide-y divide-border">
        {cart.items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 py-4">
            <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded bg-muted">
              {item.cover && <Image src={item.cover.url} alt={item.titleSnapshot} fill sizes="4rem" className="object-cover" />}
            </div>
            <div className="flex-1">
              <p className="font-medium">{item.titleSnapshot}</p>
              <p className="text-sm text-muted-foreground">
                {item.currency} {item.unitPrice.toFixed(2)} each
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={pendingItemId === item.id}
                onClick={() => changeQuantity(item, item.quantity - 1)}
                aria-label="Decrease quantity"
              >
                -
              </Button>
              <span className="w-8 text-center">{item.quantity}</span>
              <Button
                variant="outline"
                size="icon"
                disabled={pendingItemId === item.id}
                onClick={() => changeQuantity(item, item.quantity + 1)}
                aria-label="Increase quantity"
              >
                +
              </Button>
            </div>
            <p className="w-24 text-right font-medium">
              {item.currency} {(item.unitPrice * item.quantity).toFixed(2)}
            </p>
            <Button variant="ghost" size="sm" disabled={pendingItemId === item.id} onClick={() => remove(item)}>
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-lg font-semibold">
          Subtotal: {cart.currency} {cart.subtotal.toFixed(2)}
        </span>
        <Button size="lg" onClick={() => router.push("/checkout")}>
          Proceed to checkout
        </Button>
      </div>
    </div>
  );
}
