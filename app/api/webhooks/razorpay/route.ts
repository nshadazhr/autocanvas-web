import { NextResponse } from "next/server";
import { getPaymentProvider, applyBillingEvent, registerBuiltInPaymentProviders } from "@platform/billing";

registerBuiltInPaymentProviders();

export async function POST(request: Request) {
  // Same raw-body requirement as the Stripe route above — Razorpay's HMAC
  // is computed over the exact raw bytes, not a re-serialized JSON.parse
  // round-trip.
  const rawBody = await request.text();
  const headers = { "x-razorpay-signature": request.headers.get("x-razorpay-signature") };

  let event;
  try {
    event = getPaymentProvider("RAZORPAY").parseWebhookEvent(rawBody, headers);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature or payload." }, { status: 400 });
  }

  if (event) {
    await applyBillingEvent(event);
  }

  return NextResponse.json({ received: true });
}
