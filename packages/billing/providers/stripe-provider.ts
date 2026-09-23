import Stripe from "stripe";
import { getStripeConfig } from "../src/config";
import { PlanNotCheckoutReadyError, WebhookSignatureError } from "../src/errors";
import { loadPlanForCheckout } from "../src/plan-lookup";
import type {
  CheckoutSession,
  CreateCheckoutSessionInput,
  NormalizedBillingEvent,
  PaymentProvider,
} from "../src/types";
import type { SubscriptionStatusValue } from "../src/enums";

let client: Stripe | undefined;

function getClient(): Stripe {
  if (!client) {
    client = new Stripe(getStripeConfig().secretKey, { apiVersion: "2024-06-20" });
  }
  return client;
}

/** Stripe's subscription.status strings -> our schema's SubscriptionStatus enum. */
function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatusValue {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    case "incomplete":
    case "incomplete_expired":
    case "paused":
      return "INCOMPLETE";
    default:
      return "INCOMPLETE";
  }
}

export const StripeProvider: PaymentProvider = {
  key: "STRIPE",

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSession> {
    const plan = await loadPlanForCheckout(input.planKey);
    if (!plan.stripePriceId) {
      throw new PlanNotCheckoutReadyError(input.planKey, "Stripe");
    }

    const session = await getClient().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      customer_email: input.userEmail,
      client_reference_id: input.userId,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      // Metadata on the Checkout Session itself is NOT automatically copied
      // onto the Subscription object Stripe creates behind it — that needs
      // its own `subscription_data.metadata`. Both are set here so
      // checkout.session.completed AND every later customer.subscription.*
      // webhook carry the same userId/planKey, even though only the
      // *first* of those (checkout.session.completed) actually needs it —
      // see webhook-handler.ts's comment on why later events look the
      // local row up by providerSubscriptionId instead.
      metadata: { userId: input.userId, planKey: input.planKey },
      subscription_data: { metadata: { userId: input.userId, planKey: input.planKey } },
    });

    if (!session.url) {
      // Stripe only omits `url` for a handful of edge-case configurations
      // (e.g. Checkout Sessions created for a UI-mode embedded component)
      // that this integration never opts into — surfaced loudly if it
      // somehow happens rather than returning an empty string to redirect to.
      throw new Error(`Stripe Checkout Session ${session.id} was created without a redirect url.`);
    }

    return { url: session.url, providerReferenceId: session.id };
  },

  parseWebhookEvent(rawBody: string, headers: Record<string, string | null | undefined>): NormalizedBillingEvent | null {
    const signature = headers["stripe-signature"];
    if (!signature) {
      throw new WebhookSignatureError("Stripe");
    }

    let event: Stripe.Event;
    try {
      event = getClient().webhooks.constructEvent(rawBody, signature, getStripeConfig().webhookSecret);
    } catch {
      throw new WebhookSignatureError("Stripe");
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription" || typeof session.subscription !== "string") {
          return null; // one-off Payment mode checkout, not a subscription — out of scope this chunk
        }
        return {
          kind: "subscription.upserted",
          provider: "STRIPE",
          providerSubscriptionId: session.subscription,
          // Real status/period land moments later via customer.subscription.updated;
          // ACTIVE here is a reasonable default since Stripe only fires this event
          // at all once the initial payment for a subscription-mode session succeeded.
          status: "ACTIVE",
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          planKey: session.metadata?.planKey,
          userId: session.metadata?.userId ?? session.client_reference_id ?? undefined,
        };
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        return {
          kind: "subscription.upserted",
          provider: "STRIPE",
          providerSubscriptionId: subscription.id,
          status: mapStripeStatus(subscription.status),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          planKey: subscription.metadata?.planKey,
          userId: subscription.metadata?.userId,
        };
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        return { kind: "subscription.canceled", provider: "STRIPE", providerSubscriptionId: subscription.id };
      }

      case "invoice.payment_succeeded":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const amountCents = event.type === "invoice.payment_succeeded" ? invoice.amount_paid : invoice.amount_due;
        return {
          kind: "payment.settled",
          provider: "STRIPE",
          providerPaymentId: invoice.id,
          providerSubscriptionId: typeof invoice.subscription === "string" ? invoice.subscription : undefined,
          status: event.type === "invoice.payment_succeeded" ? "SUCCEEDED" : "FAILED",
          amountCents,
          currency: invoice.currency,
          rawPayload: event,
        };
      }

      default:
        return null; // every other Stripe event type is intentionally ignored
    }
  },
};
