// ─────────────────────────────────────────────────────────────────────────
// The PaymentProvider contract. Same shape of idea as @platform/ai-core's
// AudioProvider (Chunk 5): nothing outside this package (and outside
// providers/*) should ever import the `stripe`/`razorpay` SDKs directly.
// Every caller — apps/web's checkout Server Action, its two webhook
// routes — goes through `getPaymentProvider(key)` from registry.ts and
// talks to whatever comes back purely through this interface. Adding
// Cashfree later (the enum already has a slot for it — see
// PaymentProviderKey in schema.prisma) means writing one new file in
// providers/ and registering it; nothing here or in apps/web changes.
//
// Unlike AudioProvider, there's no DB-driven isActive toggle for payment
// providers — swapping which gateway is available is a business/ops
// decision (which checkout button shows), not something that needs a
// no-deploy admin switch the way an AI vendor outage does. The `apps/web`
// billing page decides which buttons to show; this interface doesn't need
// an activity flag to support that.
// ─────────────────────────────────────────────────────────────────────────

import type { PaymentProviderKeyValue, PaymentStatusValue, SubscriptionStatusValue } from "./enums";

export interface CreateCheckoutSessionInput {
  /** SubscriptionPlan.key — "creator" | "pro" | "business" (not "free"/"enterprise", which never go through checkout). */
  planKey: string;
  userId: string;
  userEmail: string;
  /** Where the provider's hosted checkout page redirects on success/cancel. */
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSession {
  /** The URL to redirect the user's browser to — Stripe's Checkout Session URL, Razorpay's subscription short_url. */
  url: string;
  /** The provider's own id for this checkout attempt (Stripe checkout session id, Razorpay subscription id). Not stored anywhere yet at this point — we only learn the *real* provider subscription id for certain once the webhook fires. */
  providerReferenceId: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Normalized webhook events. Stripe and Razorpay have completely
// different payload shapes for "a subscription just started" or "a
// payment just succeeded" — every provider adapter's parseWebhookEvent()
// is responsible for translating its own vendor payload into ONE of these
// three shapes, so packages/billing's webhook-handler.ts (the actual
// DB-writing logic) is written against this union exactly once, not once
// per provider. See providers/stripe-provider.ts / razorpay-provider.ts
// for the translation, and webhook-handler.ts for what each shape does.
// ─────────────────────────────────────────────────────────────────────────

/**
 * A subscription came into existence or had its status/period updated.
 * `planKey`/`userId` are only present when the event itself carries them
 * (Stripe's checkout.session.completed metadata, Razorpay's subscription
 * notes) — present at creation time, typically absent on later renewal/
 * status-change events, where the local Subscription row is looked up by
 * `providerSubscriptionId` instead (it must already exist by then).
 */
export interface SubscriptionUpsertedEvent {
  kind: "subscription.upserted";
  provider: PaymentProviderKeyValue;
  providerSubscriptionId: string;
  status: SubscriptionStatusValue;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  planKey?: string;
  userId?: string;
}

/** A subscription was canceled/ended on the provider's side. */
export interface SubscriptionCanceledEvent {
  kind: "subscription.canceled";
  provider: PaymentProviderKeyValue;
  providerSubscriptionId: string;
}

/**
 * A single payment attempt settled (succeeded or failed). This is what
 * actually grants credits (on SUCCEEDED, and only the first time a given
 * providerPaymentId is seen — see webhook-handler.ts) — subscription
 * status events above never grant credits themselves, deliberately, so
 * "was this specific charge paid" and "what state is the subscription in"
 * stay two independently-idempotent operations instead of one entangled one.
 */
export interface PaymentSettledEvent {
  kind: "payment.settled";
  provider: PaymentProviderKeyValue;
  providerPaymentId: string;
  /** Which local Subscription this payment renews, if any — used to resolve which plan's monthlyCredits to grant and which CreditAccount to grant them to. */
  providerSubscriptionId?: string;
  status: PaymentStatusValue;
  amountCents: number;
  currency: string;
  /** Fallback identity when providerSubscriptionId can't resolve a local Subscription yet (shouldn't normally happen — flagged, not silently dropped, if it does). */
  userId?: string;
  rawPayload: unknown;
}

export type NormalizedBillingEvent = SubscriptionUpsertedEvent | SubscriptionCanceledEvent | PaymentSettledEvent;

export interface PaymentProvider {
  readonly key: PaymentProviderKeyValue;

  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSession>;

  /**
   * Verifies the webhook's signature AND normalizes it in one call — a
   * signature-invalid request should never even reach a "what kind of
   * event is this" branch. Returns `null` for event types we intentionally
   * ignore (e.g. Stripe's `charge.updated`), which is not an error: the
   * caller should just 200 the webhook and do nothing.
   *
   * `rawBody` must be the exact, unparsed request body bytes — both
   * providers sign the raw bytes, not a re-serialized JSON.parse/stringify
   * round-trip of them (which can reorder keys or change whitespace and
   * silently break the signature check).
   */
  parseWebhookEvent(rawBody: string, headers: Record<string, string | null | undefined>): NormalizedBillingEvent | null;
}
