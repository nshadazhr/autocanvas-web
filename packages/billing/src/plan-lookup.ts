import { prisma } from "@platform/database";
import { PlanNotFoundError } from "./errors";

// Shared by both provider adapters — "resolve a plan key to the provider-
// specific price/plan id" is identical logic either way, only which column
// gets read differs at the call site.
export interface PlanCheckoutInfo {
  id: string;
  key: string;
  stripePriceId: string | null;
  razorpayPlanId: string | null;
}

export async function loadPlanForCheckout(planKey: string): Promise<PlanCheckoutInfo> {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { key: planKey } });
  if (!plan) {
    throw new PlanNotFoundError(planKey);
  }
  return plan as PlanCheckoutInfo;
}
