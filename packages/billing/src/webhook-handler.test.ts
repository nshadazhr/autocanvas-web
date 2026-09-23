import { describe, it, expect, vi, beforeEach } from "vitest";

// `webhook-handler.ts` only ever touches four prisma models
// (subscription/payment/invoice/subscriptionPlan + creditAccount) and one
// function from @platform/credits (grantCredits) — every other collaborator
// (Stripe/Razorpay SDKs, signature verification) lives one layer up in
// providers/*-provider.ts and is completely irrelevant to this file's own
// logic. So, same pattern as packages/queue/src/retry.test.ts: mock both
// boundaries, feed in already-normalized NormalizedBillingEvent objects
// (exactly what parseWebhookEvent() would have produced), and assert
// applyBillingEvent()'s own upsert/idempotency decisions in isolation.
const subscriptionFindFirst = vi.fn();
const subscriptionUpdate = vi.fn();
const subscriptionCreate = vi.fn();
const subscriptionPlanFindUnique = vi.fn();
const paymentFindFirst = vi.fn();
const paymentUpdate = vi.fn();
const paymentCreate = vi.fn();
const invoiceCreate = vi.fn();
const creditAccountFindUnique = vi.fn();

vi.mock("@platform/database", () => ({
  prisma: {
    subscription: {
      findFirst: (...args: unknown[]) => subscriptionFindFirst(...args),
      update: (...args: unknown[]) => subscriptionUpdate(...args),
      create: (...args: unknown[]) => subscriptionCreate(...args),
    },
    subscriptionPlan: {
      findUnique: (...args: unknown[]) => subscriptionPlanFindUnique(...args),
    },
    payment: {
      findFirst: (...args: unknown[]) => paymentFindFirst(...args),
      update: (...args: unknown[]) => paymentUpdate(...args),
      create: (...args: unknown[]) => paymentCreate(...args),
    },
    invoice: {
      create: (...args: unknown[]) => invoiceCreate(...args),
    },
    creditAccount: {
      findUnique: (...args: unknown[]) => creditAccountFindUnique(...args),
    },
  },
}));

const grantCredits = vi.fn();
vi.mock("@platform/credits", () => ({
  grantCredits: (...args: unknown[]) => grantCredits(...args),
}));

const { applyBillingEvent } = await import("./webhook-handler");
const { MissingCheckoutMetadataError, PlanNotFoundError } = await import("./errors");

beforeEach(() => {
  subscriptionFindFirst.mockReset();
  subscriptionUpdate.mockReset();
  subscriptionCreate.mockReset();
  subscriptionPlanFindUnique.mockReset();
  paymentFindFirst.mockReset();
  paymentUpdate.mockReset();
  paymentCreate.mockReset();
  invoiceCreate.mockReset();
  creditAccountFindUnique.mockReset();
  grantCredits.mockReset();
});

describe("applyBillingEvent — subscription.upserted", () => {
  it("creates a new local Subscription row when none exists yet and metadata (userId/planKey) is present", async () => {
    subscriptionFindFirst.mockResolvedValue(null);
    subscriptionPlanFindUnique.mockResolvedValue({ id: "plan_1", monthlyCredits: 500 });
    subscriptionCreate.mockResolvedValue({ id: "sub_1" });

    await applyBillingEvent({
      kind: "subscription.upserted",
      provider: "STRIPE",
      providerSubscriptionId: "sub_stripe_1",
      status: "ACTIVE",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      planKey: "creator",
      userId: "user_1",
    });

    expect(subscriptionCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        planId: "plan_1",
        provider: "STRIPE",
        providerSubscriptionId: "sub_stripe_1",
        status: "ACTIVE",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      },
    });
    expect(subscriptionUpdate).not.toHaveBeenCalled();
  });

  it("throws MissingCheckoutMetadataError when creating fresh and userId/planKey are absent", async () => {
    subscriptionFindFirst.mockResolvedValue(null);

    await expect(
      applyBillingEvent({
        kind: "subscription.upserted",
        provider: "STRIPE",
        providerSubscriptionId: "sub_stripe_2",
        status: "ACTIVE",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      }),
    ).rejects.toBeInstanceOf(MissingCheckoutMetadataError);
    expect(subscriptionCreate).not.toHaveBeenCalled();
  });

  it("throws PlanNotFoundError when planKey doesn't match any local SubscriptionPlan", async () => {
    subscriptionFindFirst.mockResolvedValue(null);
    subscriptionPlanFindUnique.mockResolvedValue(null);

    await expect(
      applyBillingEvent({
        kind: "subscription.upserted",
        provider: "STRIPE",
        providerSubscriptionId: "sub_stripe_3",
        status: "ACTIVE",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        planKey: "nonexistent",
        userId: "user_1",
      }),
    ).rejects.toBeInstanceOf(PlanNotFoundError);
    expect(subscriptionCreate).not.toHaveBeenCalled();
  });

  it("updates status/period/cancelAtPeriodEnd on an existing row, never touching userId/planId, when a matching (provider, providerSubscriptionId) row already exists", async () => {
    subscriptionFindFirst.mockResolvedValue({ id: "sub_row_1", userId: "user_1", planId: "plan_1" });
    const periodEnd = new Date("2026-10-23T00:00:00Z");

    await applyBillingEvent({
      kind: "subscription.upserted",
      provider: "STRIPE",
      providerSubscriptionId: "sub_stripe_1",
      status: "PAST_DUE",
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: true,
    });

    expect(subscriptionUpdate).toHaveBeenCalledWith({
      where: { id: "sub_row_1" },
      data: { status: "PAST_DUE", currentPeriodEnd: periodEnd, cancelAtPeriodEnd: true },
    });
    expect(subscriptionCreate).not.toHaveBeenCalled();
  });
});

describe("applyBillingEvent — subscription.canceled", () => {
  it("no-ops when no matching local Subscription row exists (stale/replayed webhook)", async () => {
    subscriptionFindFirst.mockResolvedValue(null);

    await applyBillingEvent({
      kind: "subscription.canceled",
      provider: "RAZORPAY",
      providerSubscriptionId: "sub_rzp_missing",
    });

    expect(subscriptionUpdate).not.toHaveBeenCalled();
  });

  it("sets status to CANCELED on the matching local row", async () => {
    subscriptionFindFirst.mockResolvedValue({ id: "sub_row_2" });

    await applyBillingEvent({
      kind: "subscription.canceled",
      provider: "RAZORPAY",
      providerSubscriptionId: "sub_rzp_1",
    });

    expect(subscriptionUpdate).toHaveBeenCalledWith({
      where: { id: "sub_row_2" },
      data: { status: "CANCELED" },
    });
  });
});

describe("applyBillingEvent — payment.settled", () => {
  it("on a brand-new SUCCEEDED payment tied to a subscription: creates the Payment row, grants the plan's monthlyCredits, and creates an Invoice", async () => {
    paymentFindFirst.mockResolvedValue(null);
    subscriptionFindFirst.mockResolvedValue({ id: "sub_row_1", userId: "user_1", planId: "plan_1" });
    paymentCreate.mockResolvedValue({ id: "payment_abc12345" });
    subscriptionPlanFindUnique.mockResolvedValue({ id: "plan_1", monthlyCredits: 500 });
    creditAccountFindUnique.mockResolvedValue({ id: "acct_1" });

    await applyBillingEvent({
      kind: "payment.settled",
      provider: "STRIPE",
      providerPaymentId: "in_1",
      providerSubscriptionId: "sub_stripe_1",
      status: "SUCCEEDED",
      amountCents: 2900,
      currency: "usd",
      rawPayload: { raw: true },
    });

    expect(paymentCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        subscriptionId: "sub_row_1",
        provider: "STRIPE",
        providerPaymentId: "in_1",
        amountCents: 2900,
        currency: "usd",
        status: "SUCCEEDED",
        rawPayload: { raw: true },
      },
    });
    expect(grantCredits).toHaveBeenCalledWith("acct_1", 500n, {
      referenceType: "payment",
      referenceId: "payment_abc12345",
    });
    expect(invoiceCreate).toHaveBeenCalledWith({
      data: { paymentId: "payment_abc12345", number: expect.stringContaining("INV-") },
    });
  });

  it("is a no-op on duplicate delivery of an already-recorded payment — never re-grants credits", async () => {
    paymentFindFirst.mockResolvedValue({ id: "payment_1", status: "SUCCEEDED" });

    await applyBillingEvent({
      kind: "payment.settled",
      provider: "STRIPE",
      providerPaymentId: "in_1",
      providerSubscriptionId: "sub_stripe_1",
      status: "SUCCEEDED",
      amountCents: 2900,
      currency: "usd",
      rawPayload: {},
    });

    expect(paymentCreate).not.toHaveBeenCalled();
    expect(grantCredits).not.toHaveBeenCalled();
    expect(paymentUpdate).not.toHaveBeenCalled();
  });

  it("patches status on a duplicate delivery only when the provider now reports a different status, still without touching credits", async () => {
    paymentFindFirst.mockResolvedValue({ id: "payment_1", status: "PENDING" });

    await applyBillingEvent({
      kind: "payment.settled",
      provider: "STRIPE",
      providerPaymentId: "in_1",
      status: "FAILED",
      amountCents: 2900,
      currency: "usd",
      rawPayload: {},
    });

    expect(paymentUpdate).toHaveBeenCalledWith({ where: { id: "payment_1" }, data: { status: "FAILED" } });
    expect(grantCredits).not.toHaveBeenCalled();
  });

  it("never grants credits or creates an invoice for a FAILED payment, but still records the Payment row", async () => {
    paymentFindFirst.mockResolvedValue(null);
    subscriptionFindFirst.mockResolvedValue({ id: "sub_row_1", userId: "user_1", planId: "plan_1" });
    paymentCreate.mockResolvedValue({ id: "payment_failed_1" });

    await applyBillingEvent({
      kind: "payment.settled",
      provider: "STRIPE",
      providerPaymentId: "in_2",
      providerSubscriptionId: "sub_stripe_1",
      status: "FAILED",
      amountCents: 2900,
      currency: "usd",
      rawPayload: {},
    });

    expect(paymentCreate).toHaveBeenCalled();
    expect(grantCredits).not.toHaveBeenCalled();
    expect(invoiceCreate).not.toHaveBeenCalled();
  });

  it("throws MissingCheckoutMetadataError when the payment can't be tied to any subscription and carries no userId fallback", async () => {
    paymentFindFirst.mockResolvedValue(null);
    subscriptionFindFirst.mockResolvedValue(null);

    await expect(
      applyBillingEvent({
        kind: "payment.settled",
        provider: "STRIPE",
        providerPaymentId: "in_orphan",
        providerSubscriptionId: "sub_stripe_unknown",
        status: "SUCCEEDED",
        amountCents: 2900,
        currency: "usd",
        rawPayload: {},
      }),
    ).rejects.toBeInstanceOf(MissingCheckoutMetadataError);
    expect(paymentCreate).not.toHaveBeenCalled();
  });

  it("falls back to event.userId when no local Subscription matches, and skips crediting since there's no plan to size the grant from", async () => {
    paymentFindFirst.mockResolvedValue(null);
    subscriptionFindFirst.mockResolvedValue(null);
    paymentCreate.mockResolvedValue({ id: "payment_fallback_1" });

    await applyBillingEvent({
      kind: "payment.settled",
      provider: "RAZORPAY",
      providerPaymentId: "pay_orphan_but_has_userid",
      status: "SUCCEEDED",
      amountCents: 1500,
      currency: "inr",
      userId: "user_fallback",
      rawPayload: {},
    });

    expect(paymentCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_fallback",
        subscriptionId: undefined,
        provider: "RAZORPAY",
        providerPaymentId: "pay_orphan_but_has_userid",
        amountCents: 1500,
        currency: "inr",
        status: "SUCCEEDED",
        rawPayload: {},
      },
    });
    // No subscription resolved -> no plan -> no credits, but the payment is still on record.
    expect(grantCredits).not.toHaveBeenCalled();
    expect(invoiceCreate).toHaveBeenCalledWith({
      data: { paymentId: "payment_fallback_1", number: expect.stringContaining("INV-") },
    });
  });
});
