import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resetBillingConfigCache } from "../src/config";

// Unlike Razorpay's HMAC (which this package computes itself, so it's
// worth exercising for real — see razorpay-provider.test.ts), Stripe's
// signature scheme lives entirely inside `stripe.webhooks.constructEvent`,
// a vendor SDK internal we don't own or re-implement. So this file mocks
// the SDK boundary and asserts what StripeProvider does on either side of
// it: reject up front when the signature header is missing, propagate a
// WebhookSignatureError when the SDK itself rejects the signature, and
// correctly normalize whatever event object the SDK hands back.
const constructEvent = vi.fn();
const checkoutSessionsCreate = vi.fn();
vi.mock("stripe", () => ({
  default: class {
    webhooks = { constructEvent: (...args: unknown[]) => constructEvent(...args) };
    checkout = { sessions: { create: (...args: unknown[]) => checkoutSessionsCreate(...args) } };
  },
}));

// StripeProvider also imports loadPlanForCheckout (plan-lookup.ts), which
// pulls in @platform/database — irrelevant to parseWebhookEvent, the only
// method exercised in this file, but the import chain still needs to
// resolve. Same boundary-mocking approach as webhook-handler.test.ts.
vi.mock("@platform/database", () => ({ prisma: { subscriptionPlan: { findUnique: vi.fn() } } }));

beforeEach(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_123";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_123";
  resetBillingConfigCache();
  constructEvent.mockReset();
  checkoutSessionsCreate.mockReset();
});

afterEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  resetBillingConfigCache();
});

const { StripeProvider } = await import("./stripe-provider");
const { WebhookSignatureError } = await import("../src/errors");

describe("StripeProvider.parseWebhookEvent", () => {
  it("throws WebhookSignatureError when the stripe-signature header is missing, without ever calling the SDK", () => {
    expect(() => StripeProvider.parseWebhookEvent("{}", {})).toThrow(WebhookSignatureError);
    expect(constructEvent).not.toHaveBeenCalled();
  });

  it("throws WebhookSignatureError when the SDK's own signature check throws", () => {
    constructEvent.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature for payload");
    });
    expect(() =>
      StripeProvider.parseWebhookEvent("{}", { "stripe-signature": "t=1,v1=bad" }),
    ).toThrow(WebhookSignatureError);
  });

  it("normalizes checkout.session.completed (subscription mode) into subscription.upserted with metadata", () => {
    constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          subscription: "sub_stripe_1",
          metadata: { planKey: "creator", userId: "user_1" },
          client_reference_id: "user_1",
        },
      },
    });

    const result = StripeProvider.parseWebhookEvent("{}", { "stripe-signature": "t=1,v1=good" });

    expect(result).toEqual({
      kind: "subscription.upserted",
      provider: "STRIPE",
      providerSubscriptionId: "sub_stripe_1",
      status: "ACTIVE",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      planKey: "creator",
      userId: "user_1",
    });
  });

  it("returns null for checkout.session.completed in payment mode (one-off, not subscription) rather than treating it as a subscription event", () => {
    constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { mode: "payment", subscription: null } },
    });

    expect(StripeProvider.parseWebhookEvent("{}", { "stripe-signature": "t=1,v1=good" })).toBeNull();
  });

  it("normalizes invoice.payment_succeeded into payment.settled with amount_paid", () => {
    constructEvent.mockReturnValue({
      type: "invoice.payment_succeeded",
      data: {
        object: { id: "in_1", subscription: "sub_stripe_1", amount_paid: 1900, currency: "usd" },
      },
    });

    const result = StripeProvider.parseWebhookEvent("{}", { "stripe-signature": "t=1,v1=good" });

    expect(result).toMatchObject({
      kind: "payment.settled",
      provider: "STRIPE",
      providerPaymentId: "in_1",
      providerSubscriptionId: "sub_stripe_1",
      status: "SUCCEEDED",
      amountCents: 1900,
      currency: "usd",
    });
  });

  it("returns null for an event type this integration intentionally ignores", () => {
    constructEvent.mockReturnValue({ type: "charge.updated", data: { object: {} } });
    expect(StripeProvider.parseWebhookEvent("{}", { "stripe-signature": "t=1,v1=good" })).toBeNull();
  });
});
