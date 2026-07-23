import { createHmac, timingSafeEqual } from "node:crypto";

// Razorpay's documented webhook verification scheme
// (https://razorpay.com/docs/webhooks/validate-test/): the webhook
// secret HMAC-SHA256-signs the *raw* request body (not the parsed
// JSON — re-serializing and re-signing a parsed object can produce a
// different byte sequence than what Razorpay actually signed, e.g.
// over key ordering or whitespace), hex-encoded, compared against the
// X-Razorpay-Signature header. Pure/no I/O, so unlike the actual API
// calls in razorpay.client.ts this is really unit-testable without a
// live Razorpay account.
export function verifyRazorpayWebhookSignature(rawBody: string, signatureHeader: string, webhookSecret: string): boolean {
  const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(signatureHeader, "hex");
  // timingSafeEqual throws on length mismatch rather than returning
  // false — an attacker-controlled signature header must never crash
  // the request instead of just failing verification.
  if (expectedBuffer.length !== actualBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
