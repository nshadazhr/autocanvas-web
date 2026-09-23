import crypto from "node:crypto";
import Razorpay from "razorpay";
import { getRazorpayConfig } from "../src/config";
import { PlanNotCheckoutReadyError, WebhookSignatureError } from "../src/errors";
import { loadPlanForCheckout } from "../src/plan-lookup";
import type {
  CheckoutSession,
  CreateCheckoutSessionInput,
  NormalizedBillingEvent,
  PaymentProvider,
} from "../src/types";

// Razorpay subscriptions require a finite `total_count` of billing cycles
// up front — there's no "runs forever" option the way Stripe subscriptions
// default to. 120 monthly cycles (10 years) is the standard workaround
// or a very-long-running plan without genuinely meaning "cancel automatically
// after 10 years" — cancellation in practice is always user/admin-initiated
// (see cancelSubscription in registry usage) well before this would matter.
const RAZORPAY_SUBSCRIPTION_TOTAL_CYCLES = 120;

let client: Razorpay | undefined;

function getClient(): Razorpay {
  if (!client) {
    const config = getRazorpayConfig();
    client = new Razorpay({ key_id: config.keyId, key_secret: config.keySecret });
  }
  return client;
}

interface RazorpaySubscriptionEntity {
  id: string;
  plan_id: string;
  status: string;
  current_end: number | null;
  notes?: Record<string, string>;
}

interface RazorpayPaymentEntity {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

interface RazorpayWebhookBody {
  event: string;
  payload: {
    subscription?: { entity: RazorpaySubscriptionEntity };
    payment?: { entity: RazorpayPaymentEntity };
  };
}

export const RazorpayProvider: PaymentProvider = {
  key: "RAZORPAY",

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSession> {
    const plan = await loadPlanForCheckout(input.planKey);
    if (!plan.razorpayPlanId) {
      throw new PlanNotCheckoutReadyError(input.planKey, "Razorpay");
    }

    // notes are the ONLY place Razorpay lets us attach our own metadata to
    // a subscription — every subsequent webhook's payload.subscription.entity.notes
    // carries this straight through, same role Stripe's subscription_data.metadata plays above.
    const subscription = await getClient().subscriptions.create({
      plan_id: plan.razorpayPlanId,
      total_count: RAZORPAY_SUBSCRIPTION_TOTAL_CYCLES,
      customer_notify: 1,
      notes: { userId: input.userId, planKey: input.planKey },
    });

    if (!subscription.short_url) {
      throw new Error(`Razorpay subscription ${subscription.id} was created without a short_url to redirect to.`);
    }

    return { url: subscription.short_url, providerReferenceId: subscription.id };
  },

  parseWebhookEvent(rawBody: string, headers: Record<string, string | null | undefined>): NormalizedBillingEvent | null {
    const signature = headers["x-razorpay-signature"];
    if (!signature) {
      throw new WebhookSignatureError("Razorpay");
    }

    const expected = crypto.createHmac("sha256", getRazorpayConfig().webhookSecret).update(rawBody).digest("hex");
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    const signaturesMatch =
      signatureBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    if (!signaturesMatch) {
      throw new WebhookSignatureError("Razorpay");
    }

    const body = JSON.parse(rawBody) as RazorpayWebhookBody;

    switch (body.event) {
      case "subscription.activated": {
        const entity = body.payload.subscription?.entity;
        if (!entity) return null;
        return {
          kind: "subscription.upserted",
          provider: "RAZORPAY",
          providerSubscriptionId: entity.id,
          status: "ACTIVE",
          currentPeriodEnd: entity.current_end ? new Date(entity.current_end * 1000) : null,
          cancelAtPeriodEnd: false,
          planKey: entity.notes?.planKey,
          userId: entity.notes?.userId,
        };
      }

      case "subscription.charged": {
        const paymentEntity = body.payload.payment?.entity;
        const subscriptionEntity = body.payload.subscription?.entity;
        if (!paymentEntity) return null;
        return {
          kind: "payment.settled",
          provider: "RAZORPAY",
          providerPaymentId: paymentEntity.id,
          providerSubscriptionId: subscriptionEntity?.id,
          status: "SUCCEEDED",
          // Razorpay payment amounts already arrive in the smallest currency
          // unit (paise for INR, cents for USD) — same convention our own
          // Payment.amountCents column assumes, so no conversion needed.
          amountCents: paymentEntity.amount,
          currency: paymentEntity.currency,
          rawPayload: body,
        };
      }

      case "subscription.halted": {
        // Razorpay auto-halts a subscription after repeated charge failures
        // — the closest equivalent to Stripe's past_due status, not an
        // outright cancellation (that's subscription.cancelled, below).
        const entity = body.payload.subscription?.entity;
        if (!entity) return null;
        return {
          kind: "subscription.upserted",
          provider: "RAZORPAY",
          providerSubscriptionId: entity.id,
          status: "PAST_DUE",
          currentPeriodEnd: entity.current_end ? new Date(entity.current_end * 1000) : null,
          cancelAtPeriodEnd: false,
        };
      }

      case "subscription.cancelled": {
        const entity = body.payload.subscription?.entity;
        if (!entity) return null;
        return { kind: "subscription.canceled", provider: "RAZORPAY", providerSubscriptionId: entity.id };
      }

      default:
        return null; // subscription.paused/resumed/pending/completed etc. — deliberately out of scope this chunk
    }
  },
};
