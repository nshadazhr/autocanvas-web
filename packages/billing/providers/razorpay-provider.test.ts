import crypto from "node:crypto";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resetBillingConfigCache } from "../src/config";

// This file never calls createCheckoutSession (that needs a real network-
// calling Razorpay client), only parseWebhookEvent — which never touches
// the SDK client at all, only crypto + JSON.parse. Mocking the "razorpay"
// import to a harmless stub avoids needing the real dependency installed
// just to satisfy the top-level `import Razorpay from "razorpay"` in
// razorpay-provider.ts.
vi.mock("razorpay", () => ({
  default: class {
    subscriptions = { create: vi.fn() };
  },
}));

// Same reasoning as stripe-provider.test.ts — RazorpayProvider also imports
// loadPlanForCheckout (plan-lookup.ts), which pulls in @platform/database.
vi.mock("@platform/database", () => ({ prisma: { subscriptionPlan: { findUnique: vi.fn() } } }));

// Deliberately does NOT mock crypto or the webhook-secret env var — the
// whole point of this file is exercising the *real* HMAC verification path
// (the most security-critical code in this package), not a stubbed-out
// version of it. `subscriptions.create`/checkout is still not exercised
// here since it requires a real network-calling Razorpay client; that's
// covered by createCheckoutSession's own thin wrapper around the SDK,
// which webhook-handler.test.ts's DB-layer coverage doesn't touch anyway.
const WEBHOOK_SECRET = "test_razorpay_webhook_secret";

function sign(rawBody: string): string {
  return crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
}

beforeEach(() => {
  process.env.RAZORPAY_KEY_ID = "rzp_test_key";
  process.env.RAZORPAY_KEY_SECRET = "rzp_test_secret";
  process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
  resetBillingConfigCache();
});

afterEach(() => {
  delete process.env.RAZORPAY_KEY_ID;
  delete process.env.RAZORPAY_KEY_SECRET;
  delete process.env.RAZORPAY_WEBHOOK_SECRET;
  resetBillingConfigCache();
});

const { RazorpayProvider } = await import("./razorpay-provider");
const { WebhookSignatureError } = await import("../src/errors");

describe("RazorpayProvider.parseWebhookEvent", () => {
  it("throws WebhookSignatureError when the x-razorpay-signature header is missing entirely", () => {
    const rawBody = JSON.stringify({ event: "subscription.activated", payload: {} });
    expect(() => RazorpayProvider.parseWebhookEvent(rawBody, {})).toThrow(WebhookSignatureError);
  });

  it("throws WebhookSignatureError when the signature doesn't match the raw body (tampered payload or wrong secret)", () => {
    const rawBody = JSON.stringify({ event: "subscription.activated", payload: {} });
    const wrongSignature = sign(rawBody + "tampered");
    expect(() =>
      RazorpayProvider.parseWebhookEvent(rawBody, { "x-razorpay-signature": wrongSignature }),
    ).toThrow(WebhookSignatureError);
  });

  it("accepts a validly-signed subscription.activated and normalizes it to subscription.upserted with metadata from notes", () => {
    const rawBody = JSON.stringify({
      event: "subscription.activated",
      payload: {
        subscription: {
          entity: { id: "sub_rzp_1", plan_id: "plan_1", status: "active", current_end: 1790000000, notes: { userId: "user_1", planKey: "creator" } },
        },
      },
    });
    const signature = sign(rawBody);

    const result = RazorpayProvider.parseWebhookEvent(rawBody, { "x-razorpay-signature": signature });

    expect(result).toEqual({
      kind: "subscription.upserted",
      provider: "RAZORPAY",
      providerSubscriptionId: "sub_rzp_1",
      status: "ACTIVE",
      currentPeriodEnd: new Date(1790000000 * 1000),
      cancelAtPeriodEnd: false,
      planKey: "creator",
      userId: "user_1",
    });
  });

  it("accepts a validly-signed subscription.charged and normalizes it to payment.settled", () => {
    const rawBody = JSON.stringify({
      event: "subscription.charged",
      payload: {
        payment: { entity: { id: "pay_1", amount: 190000, currency: "INR", status: "captured" } },
        subscription: { entity: { id: "sub_rzp_1", plan_id: "plan_1", status: "active", current_end: null } },
      },
    });
    const signature = sign(rawBody);

    const result = RazorpayProvider.parseWebhookEvent(rawBody, { "x-razorpay-signature": signature });

    expect(result).toMatchObject({
      kind: "payment.settled",
      provider: "RAZORPAY",
      providerPaymentId: "pay_1",
      providerSubscriptionId: "sub_rzp_1",
      status: "SUCCEEDED",
      amountCents: 190000,
      currency: "INR",
    });
  });

  it("returns null for a validly-signed but intentionally-unhandled event type (e.g. subscription.resumed)", () => {
    const rawBody = JSON.stringify({ event: "subscription.resumed", payload: {} });
    const signature = sign(rawBody);
    expect(RazorpayProvider.parseWebhookEvent(rawBody, { "x-razorpay-signature": signature })).toBeNull();
  });
});
