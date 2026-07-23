import { Injectable } from "@nestjs/common";

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string | null;
}

// Thin wrapper over Razorpay's Orders API
// (https://razorpay.com/docs/api/orders/create/): POST
// https://api.razorpay.com/v1/orders, Basic Auth with key_id:key_secret.
//
// NOT independently verified against a live Razorpay account — no
// sandbox/test-mode credentials are available in this environment
// (same category of disclosed limitation as apps/directus's and
// apps/medusa's "could not verify a live instance" notes, just for a
// third-party API instead of a self-hosted service). Written directly
// against Razorpay's own published API reference. What *is* real and
// tested here: razorpay-signature.ts's webhook HMAC verification
// (pure crypto, no network needed — see its own spec file) and every
// database/state-transition consequence of a webhook event, exercised
// against real Postgres by calling payments.service.ts's webhook
// handler directly with a hand-signed payload rather than routing
// through this client.
@Injectable()
export class RazorpayClient {
  private readonly keyId = process.env.RAZORPAY_KEY_ID;
  private readonly keySecret = process.env.RAZORPAY_KEY_SECRET;
  private readonly baseUrl = "https://api.razorpay.com/v1";

  async createOrder(amountInPaise: number, currency: string, receipt: string): Promise<RazorpayOrder> {
    if (!this.keyId || !this.keySecret) {
      throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not configured");
    }

    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
    const response = await fetch(`${this.baseUrl}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: amountInPaise, currency, receipt }),
    });

    if (!response.ok) {
      throw new Error(`Razorpay order creation failed with ${response.status}: ${await response.text()}`);
    }

    return (await response.json()) as RazorpayOrder;
  }
}
