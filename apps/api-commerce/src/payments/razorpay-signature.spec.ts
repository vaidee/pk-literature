import { createHmac } from "node:crypto";
import { verifyRazorpayWebhookSignature } from "./razorpay-signature";

const SECRET = "test-webhook-secret";

function sign(body: string, secret = SECRET): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

describe("verifyRazorpayWebhookSignature", () => {
  it("accepts a correctly signed body", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    expect(verifyRazorpayWebhookSignature(body, sign(body), SECRET)).toBe(true);
  });

  it("rejects a body that was tampered with after signing", () => {
    const original = JSON.stringify({ event: "payment.captured", amount: 100 });
    const signature = sign(original);
    const tampered = JSON.stringify({ event: "payment.captured", amount: 100000 });
    expect(verifyRazorpayWebhookSignature(tampered, signature, SECRET)).toBe(false);
  });

  it("rejects a signature produced with the wrong secret", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    expect(verifyRazorpayWebhookSignature(body, sign(body, "wrong-secret"), SECRET)).toBe(false);
  });

  it("rejects a malformed (non-hex or wrong-length) signature without throwing", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    expect(verifyRazorpayWebhookSignature(body, "not-a-real-signature", SECRET)).toBe(false);
    expect(verifyRazorpayWebhookSignature(body, "", SECRET)).toBe(false);
  });
});
