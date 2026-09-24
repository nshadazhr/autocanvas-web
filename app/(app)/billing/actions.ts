"use server";

import { redirect } from "next/navigation";
import { auth } from "@platform/auth";
import { listPlans, getCurrentPlanKey as getDummyCurrentPlanKey, applyDummyCheckout } from "../../../lib/dummy-data";

// ─────────────────────────────────────────────────────────────────────────
// DUMMY MODE — this file previously called real Stripe/Razorpay via
// `@platform/billing` (`getPaymentProvider(...).createCheckoutSession(...)`)
// and read/wrote real `SubscriptionPlan`/`Subscription` rows via
// `@platform/database`. Neither exists in this build (see
// lib/dummy-data.ts), so every function below reads/writes the in-memory
// plan state there instead. Exported names and signatures are unchanged —
// billing/page.tsx and dashboard/page.tsx needed zero changes.
// ─────────────────────────────────────────────────────────────────────────

async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not signed in.");
  }
  return session;
}

export type PaymentProviderKeyValue = "STRIPE" | "RAZORPAY";

interface PlanRow {
  key: string;
  name: string;
  monthlyCredits: number;
  priceCents: number;
  currency: string;
  stripePriceId: string | null;
  razorpayPlanId: string | null;
}

export async function listCheckoutablePlans(): Promise<PlanRow[]> {
  return listPlans();
}

export async function getCurrentPlanKey(): Promise<string | null> {
  await requireSession();
  return getDummyCurrentPlanKey();
}

/**
 * Dummy mode has no real payment provider to redirect the browser to, so
 * "checkout" completes instantly in-process — the plan switches and its
 * monthly credit allotment is granted right away — and this redirects
 * straight to the same success query param the real checkout's successUrl
 * would have landed on.
 */
export async function startCheckout(planKey: string, _provider: PaymentProviderKeyValue): Promise<void> {
  await requireSession();

  const applied = applyDummyCheckout(planKey);
  if (!applied) {
    redirect(`/billing?error=${encodeURIComponent("That plan isn't available.")}`);
  }

  redirect("/billing?checkout=success");
}
