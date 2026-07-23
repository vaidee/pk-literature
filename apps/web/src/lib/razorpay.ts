// Thin wrapper over Razorpay's Checkout.js widget
// (https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration/).
// NOT independently verified against a live Razorpay account — no
// sandbox/test-mode credentials are available in this environment,
// same disclosed limitation as apps/api-commerce/src/payments/razorpay.client.ts.
// Written directly against Razorpay's own published integration guide.

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number; // paise
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  prefill?: { email?: string; contact?: string };
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayCheckout {
  open(): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckout;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let loadPromise: Promise<void> | null = null;

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("loadRazorpayScript can only run in the browser"));
  }
  if (window.Razorpay) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay Checkout script"));
    document.body.appendChild(script);
  });
  return loadPromise;
}

export function openRazorpayCheckout(options: RazorpayCheckoutOptions): void {
  if (!window.Razorpay) {
    throw new Error("Razorpay Checkout script has not finished loading");
  }
  new window.Razorpay(options).open();
}
