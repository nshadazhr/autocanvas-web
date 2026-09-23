"use server";

import { redirect } from "next/navigation";
import { auth } from "@platform/auth";
import { prisma } from "@platform/database";
import {
  getPaymentProvider,
  registerBuiltInPaymentProviders,
  PlanNotFoundError,
  PlanNotCheckoutReadyError,
  type PaymentProviderKeyValue,
} from "@platform/billing";

// Same idempotent-register call as the two webhook routes — this Server
// Action is the other (and only other) place in apps/web that calls
// getPaymentProvider() directly.
registerBuiltInPaymentProviders();

async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not signed in.");
  }
  return session;
}

/** Real `SubscriptionPlan` row shape this page needs — prisma is untyped
 * `any` in scratch typechecks (see repo README), so this pins the fields
 * read below, same pattern as every other app/web action file. */
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
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true, key: { notIn: ["free", "enterprise"] } },
    orderBy: { priceCents: "asc" },
  });
  return plans as PlanRow[];
}

export async function getCurrentPlanKey(): Promise<string | null> {
  const session = await requireSession();
  const subscription = await prisma.subscription.findFirst({
    where: { userId: session.user.id, status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
    orderBy: { createdAt: "desc" },
    select: { plan: { select: { key: true } } },
  });
  return subscription?.plan.key ?? null;
}

/** Kicks off a hosted checkout for `planKey` via `provider` and redirects
 * the browser straight to it — same "Server Action that redirects" shape
 * as everything else in apps/web, no client-side fetch/JSON round trip. */
export async function startCheckout(planKey: string, provider: PaymentProviderKeyValue): Promise<void> {
  const session = await requireSession();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  let checkoutUrl: string;
  try {
    const result = await getPaymentProvider(provider).createCheckoutSession({
      planKey,
      userId: session.user.id,
      userEmail: session.user.email!,
      successUrl: `${appUrl}/billing?checkout=success`,
      cancelUrl: `${appUrl}/billing?checkout=canceled`,
    });
    checkoutUrl = result.url;
  } catch (error) {
    if (error instanceof PlanNotFoundError || error instanceof PlanNotCheckoutReadyError) {
      // Surfaced as a redirect with a query param rather than throwing —
      // this is a normal, user-facing "that plan isn't available yet"
      // condition (e.g. an admin hasn't finished setting up the Stripe
      // price for it), not a bug worth an error boundary over.
      redirect(`/billing?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }

  redirect(checkoutUrl);
}
