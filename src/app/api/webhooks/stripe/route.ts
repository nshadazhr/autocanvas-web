import { NextResponse } from "next/server";
import { getPaymentProvider, applyBillingEvent, registerBuiltInPaymentProviders } from "@platform/billing";

// Module-level, not inside the handler — idempotent (see bootstrap.ts), and
// this is the only place in apps/web that ever calls
// getPaymentProvider()/parseWebhookEvent() directly, so registering here is
// enough; the checkout Server Action (app/billing/actions.ts) has its own
// identical call for the same reason (each route/action is its own module).
registerBuiltInPaymentProviders();

export async function POST(request: Request) {
  // Stripe signs the exact raw request bytes — `request.json()` would
  // re-serialize through JSON.parse, which can reorder keys/whitespace and
  // silently break `stripe.webhooks.constructEvent`'s signature check. Must
  // read the raw text first.
  const rawBody = await request.text();
  const headers = { "stripe-signature": request.headers.get("stripe-signature") };

  let event;
  try {
    event = getPaymentProvider("STRIPE").parseWebhookEvent(rawBody, headers);
  } catch {
    // WebhookSignatureError or a malformed body — reject with 400 so Stripe
    // doesn't treat this as "we received it, don't retry." A bad signature
    // must never fall through to applyBillingEvent.
    return NextResponse.json({ error: "Invalid webhook signature or payload." }, { status: 400 });
  }

  if (event) {
    // Any thrown error here (MissingCheckoutMetadataError, PlanNotFoundError)
    // is a real bug worth surfacing loudly via a 500 — Stripe will retry the
    // delivery, which is the correct behavior while we investigate, rather
    // than silently dropping a payment/subscription update.
    await applyBillingEvent(event);
  }

  return NextResponse.json({ received: true });
}
