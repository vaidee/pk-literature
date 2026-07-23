"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@pk-literature/ui";
import { clientFetch } from "@/lib/api/client-fetch";
import { upsertCartItem } from "@/lib/api/commerce";
import { ApiError } from "@/lib/api/problem-details";

export function AddToCartButton({ bookId, disabled }: { bookId: string; disabled?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setError(null);
    try {
      await upsertCartItem(clientFetch, { bookId, quantity: 1 });
      router.refresh(); // re-runs CartLink's server-side item count
    } catch (err) {
      setError(err instanceof ApiError ? err.problem.detail ?? err.message : "Could not add to cart.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={onClick} disabled={disabled || pending}>
        {pending ? "Adding..." : "Add to cart"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
