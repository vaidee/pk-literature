"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Order } from "@pk-literature/domain-types";
import { Button, Input, Label } from "@pk-literature/ui";
import { clientFetch } from "@/lib/api/client-fetch";
import { checkout, createPaymentOrder } from "@/lib/api/commerce";
import { ApiError } from "@/lib/api/problem-details";
import { loadRazorpayScript, openRazorpayCheckout } from "@/lib/razorpay";
import { AddressFormFields, EMPTY_ADDRESS, type AddressFormValue } from "./address-form-fields";

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";

export function CheckoutForm() {
  const router = useRouter();
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [shipping, setShipping] = useState<AddressFormValue>(EMPTY_ADDRESS);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billing, setBilling] = useState<AddressFormValue>(EMPTY_ADDRESS);
  const [order, setOrder] = useState<Order | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmitAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const createdOrder = await checkout(clientFetch, {
        shippingAddress: { ...shipping, line2: shipping.line2 || null },
        billingAddress: billingSameAsShipping ? undefined : { ...billing, line2: billing.line2 || null },
        contactEmail,
        contactPhone,
      });
      setOrder(createdOrder);
      await payForOrder(createdOrder.id, createdOrder.total, createdOrder.currency);
    } catch (err) {
      setError(err instanceof ApiError ? (err.problem.detail ?? err.message) : "Checkout failed.");
    } finally {
      setPending(false);
    }
  }

  async function payForOrder(orderId: string, total: number, currency: string) {
    if (!RAZORPAY_KEY_ID) {
      setError(
        "Payments are not configured in this environment (NEXT_PUBLIC_RAZORPAY_KEY_ID is unset) — order created but cannot be paid for here.",
      );
      return;
    }
    try {
      const paymentOrder = await createPaymentOrder(clientFetch, orderId);
      await loadRazorpayScript();
      openRazorpayCheckout({
        key: paymentOrder.razorpayKeyId,
        amount: Math.round(total * 100),
        currency,
        order_id: paymentOrder.razorpayOrderId,
        name: "Tamil Literature",
        prefill: { email: contactEmail, contact: contactPhone },
        handler: () => router.push(`/checkout/confirmation/${orderId}`),
        modal: {
          ondismiss: () => setError("Payment was not completed. You can retry below."),
        },
      });
    } catch (err) {
      setError(err instanceof ApiError ? (err.problem.detail ?? err.message) : "Could not start payment.");
    }
  }

  if (order) {
    return (
      <div className="flex flex-col gap-4">
        <p>
          Order <span className="font-mono">{order.orderNumber}</span> created — total {order.currency} {order.total.toFixed(2)}.
        </p>
        {error && <p className="text-destructive">{error}</p>}
        <Button onClick={() => payForOrder(order.id, order.total, order.currency)}>Retry payment</Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmitAddress} className="flex max-w-2xl flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactEmail">Email</Label>
          <Input id="contactEmail" type="email" required value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactPhone">Phone</Label>
          <Input id="contactPhone" required value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Shipping address</h2>
        <AddressFormFields value={shipping} onChange={setShipping} idPrefix="shipping" />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={billingSameAsShipping}
          onChange={(e) => setBillingSameAsShipping(e.target.checked)}
        />
        Billing address is the same as shipping
      </label>

      {!billingSameAsShipping && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Billing address</h2>
          <AddressFormFields value={billing} onChange={setBilling} idPrefix="billing" />
        </div>
      )}

      {error && <p className="text-destructive">{error}</p>}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Placing order..." : "Place order and pay"}
      </Button>
    </form>
  );
}
