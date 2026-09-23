export class WebhookSignatureError extends Error {
  constructor(public readonly provider: string) {
    super(`${provider} webhook signature verification failed — request rejected, not processed.`);
    this.name = "WebhookSignatureError";
  }
}

export class UnsupportedPaymentProviderError extends Error {
  constructor(public readonly provider: string) {
    super(`No PaymentProvider implementation registered for "${provider}".`);
    this.name = "UnsupportedPaymentProviderError";
  }
}

export class PlanNotFoundError extends Error {
  constructor(public readonly planKey: string) {
    super(`SubscriptionPlan "${planKey}" does not exist.`);
    this.name = "PlanNotFoundError";
  }
}

/** Thrown by createCheckoutSession when the plan exists locally but has no
 * stripePriceId/razorpayPlanId set yet — see schema.prisma's comment on
 * SubscriptionPlan for why those columns are nullable. */
export class PlanNotCheckoutReadyError extends Error {
  constructor(public readonly planKey: string, public readonly provider: string) {
    super(`SubscriptionPlan "${planKey}" has no ${provider} price/plan id configured yet — cannot start checkout.`);
    this.name = "PlanNotCheckoutReadyError";
  }
}

/** Thrown by the webhook handler when a subscription-creating event arrives
 * without the userId/planKey metadata it needs to create a brand-new local
 * Subscription row — a real bug in checkout-session setup, not a normal
 * runtime condition, so it's surfaced loudly rather than silently dropped. */
export class MissingCheckoutMetadataError extends Error {
  constructor(public readonly providerSubscriptionId: string) {
    super(
      `Webhook for provider subscription ${providerSubscriptionId} is missing the userId/planKey metadata needed ` +
        `to create its local Subscription row, and no existing row was found to update instead.`,
    );
    this.name = "MissingCheckoutMetadataError";
  }
}
