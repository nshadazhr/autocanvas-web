import { prisma } from "@platform/database";
import { grantCredits } from "@platform/credits";
import { MissingCheckoutMetadataError, PlanNotFoundError } from "./errors";
import type { NormalizedBillingEvent, PaymentSettledEvent, SubscriptionCanceledEvent, SubscriptionUpsertedEvent } from "./types";

// ─────────────────────────────────────────────────────────────────────────
// The actual DB-writing logic behind every webhook, written once against
// the NormalizedBillingEvent union (types.ts) — completely unaware of
// whether the event originated from Stripe or Razorpay. Both webhook API
// routes in apps/web do the same three steps: (1) provider.parseWebhookEvent
// (verify signature + normalize), (2) applyBillingEvent (this file),
// (3) return 200. All the provider-specific translation lives in
// providers/*-provider.ts; nothing provider-specific lives here.
//
// Uses `prisma` directly (typed `any` via the stub — see repo README's
// sandbox-limitation notes) rather than a hand-rolled structural DB
// interface, same style as packages/queue/src/retry.ts — simple CRUD like
// this doesn't need the stricter LedgerTxClient-style port that
// packages/credits/src/ledger.ts uses for its transactional balance math.
// ─────────────────────────────────────────────────────────────────────────

export async function applyBillingEvent(event: NormalizedBillingEvent): Promise<void> {
  if (event.kind === "subscription.upserted") {
    return applySubscriptionUpserted(event);
  }
  if (event.kind === "subscription.canceled") {
    return applySubscriptionCanceled(event);
  }
  return applyPaymentSettled(event);
}

async function applySubscriptionUpserted(event: SubscriptionUpsertedEvent): Promise<void> {
  const existing = await prisma.subscription.findFirst({
    where: { provider: event.provider, providerSubscriptionId: event.providerSubscriptionId },
  });

  if (existing) {
    // Status/period update on a subscription we already know about —
    // renewals, cancel_at_period_end flips, past_due transitions. Never
    // touches userId/planId; those are immutable once the row exists (a
    // genuine plan change is a future chunk's problem, not a webhook-
    // replay concern).
    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status: event.status,
        currentPeriodEnd: event.currentPeriodEnd,
        cancelAtPeriodEnd: event.cancelAtPeriodEnd,
      },
    });
    return;
  }

  // No local row yet — this must be the very first event for this
  // subscription (Stripe's checkout.session.completed / Razorpay's
  // subscription.activated), the only place userId/planKey are ever known
  // (see providers/*-provider.ts). Every later event updates the row
  // created here instead of ever hitting this branch again.
  if (!event.userId || !event.planKey) {
    throw new MissingCheckoutMetadataError(event.providerSubscriptionId);
  }

  const plan = await prisma.subscriptionPlan.findUnique({ where: { key: event.planKey } });
  if (!plan) {
    throw new PlanNotFoundError(event.planKey);
  }

  await prisma.subscription.create({
    data: {
      userId: event.userId,
      planId: plan.id,
      provider: event.provider,
      providerSubscriptionId: event.providerSubscriptionId,
      status: event.status,
      currentPeriodEnd: event.currentPeriodEnd,
      cancelAtPeriodEnd: event.cancelAtPeriodEnd,
    },
  });
}

async function applySubscriptionCanceled(event: SubscriptionCanceledEvent): Promise<void> {
  const existing = await prisma.subscription.findFirst({
    where: { provider: event.provider, providerSubscriptionId: event.providerSubscriptionId },
  });
  if (!existing) {
    // Nothing to cancel locally — could be a stale/replayed webhook for a
    // subscription this environment never actually created (e.g. a test
    // event from the provider's dashboard). Not an error worth failing
    // the webhook over; just nothing to do.
    return;
  }
  await prisma.subscription.update({ where: { id: existing.id }, data: { status: "CANCELED" } });
}

async function applyPaymentSettled(event: PaymentSettledEvent): Promise<void> {
  const existingPayment = await prisma.payment.findFirst({
    where: { provider: event.provider, providerPaymentId: event.providerPaymentId },
  });

  if (existingPayment) {
    // Duplicate delivery of a payment we've already recorded — both
    // Stripe and Razorpay explicitly document that webhooks CAN be
    // delivered more than once. If it's already SUCCEEDED, credits were
    // already granted the first time; granting again here would double-
    // pay the user, so we return without touching credits at all. Only
    // patch the status if the provider is somehow reporting something
    // different than what's on file — still never (re-)grants credits.
    if (existingPayment.status !== event.status) {
      await prisma.payment.update({ where: { id: existingPayment.id }, data: { status: event.status } });
    }
    return;
  }

  // Resolve which local Subscription (and therefore which user + plan)
  // this payment belongs to, so we know whose CreditAccount to credit and
  // how many credits the plan they're on is worth.
  let subscription: { id: string; userId: string | null; planId: string } | null = null;
  if (event.providerSubscriptionId) {
    subscription = await prisma.subscription.findFirst({
      where: { provider: event.provider, providerSubscriptionId: event.providerSubscriptionId },
    });
  }

  const userId = subscription?.userId ?? event.userId;
  if (!userId) {
    // Shouldn't normally happen — every payment we care about is tied to
    // a subscription we already created via applySubscriptionUpserted, or
    // (defensively) the event carries its own userId fallback. Surfaced
    // loudly rather than silently dropping a payment record.
    throw new MissingCheckoutMetadataError(event.providerSubscriptionId ?? event.providerPaymentId);
  }

  const payment = await prisma.payment.create({
    data: {
      userId,
      subscriptionId: subscription?.id,
      provider: event.provider,
      providerPaymentId: event.providerPaymentId,
      amountCents: event.amountCents,
      currency: event.currency,
      status: event.status,
      rawPayload: event.rawPayload,
    },
  });

  if (event.status !== "SUCCEEDED") {
    return; // failed/refunded payments never grant credits or an invoice
  }

  if (subscription) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: subscription.planId } });
    if (plan) {
      const creditAccount = await prisma.creditAccount.findUnique({ where: { userId } });
      if (creditAccount) {
        await grantCredits(creditAccount.id, BigInt(plan.monthlyCredits), {
          referenceType: "payment",
          referenceId: payment.id,
        });
      }
    }
  }

  // No PDF generation this chunk (Invoice.pdfStorageKey stays null) — just
  // the record that a payment produced an invoice, with a simple
  // deterministic number derived from the payment's own id. A real
  // sequential/formatted invoice numbering scheme is a billing-polish
  // follow-up, not a correctness requirement for credits to land.
  await prisma.invoice.create({
    data: { paymentId: payment.id, number: `INV-${String(payment.id).slice(0, 8).toUpperCase()}` },
  });
}
