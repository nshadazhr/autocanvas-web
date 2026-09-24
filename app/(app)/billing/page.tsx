import { auth } from "@platform/auth";
import { getCreditAccount } from "../../../lib/dummy-data";
import { listCheckoutablePlans, getCurrentPlanKey, startCheckout } from "./actions";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";

function formatPrice(cents: number, currency: string): string {
  if (cents === 0) return "Free";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { checkout?: string; error?: string };
}) {
  const session = await auth();
  if (!session?.user) return null; // middleware already redirects; satisfies TS

  const [plans, currentPlanKey, creditAccount] = await Promise.all([
    listCheckoutablePlans(),
    getCurrentPlanKey(),
    Promise.resolve(getCreditAccount()),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Billing &amp; Plans</h1>
        <p className="mt-1 text-sm text-slate-600">
          Current credit balance: <strong className="text-slate-900">{creditAccount.balance}</strong>
          {currentPlanKey ? (
            <>
              {" "}
              · Current plan: <strong className="capitalize text-slate-900">{currentPlanKey}</strong>
            </>
          ) : null}
        </p>
      </div>

      {searchParams.checkout === "success" ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Checkout complete — your plan and credits will update as soon as the payment provider confirms it (usually
          within a few seconds).
        </p>
      ) : null}
      {searchParams.checkout === "canceled" ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Checkout canceled — no changes were made to your plan.
        </p>
      ) : null}
      {searchParams.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {searchParams.error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {plans.map((plan) => {
          const isCurrent = plan.key === currentPlanKey;
          return (
            <Card key={plan.key} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="flex items-center gap-2 font-medium text-slate-900">
                  {plan.name}
                  {isCurrent ? <Badge tone="green">Current plan</Badge> : null}
                </p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {formatPrice(plan.priceCents, plan.currency)}/month · {plan.monthlyCredits.toLocaleString()} credits
                </p>
              </div>

              {isCurrent ? (
                <span className="text-sm text-slate-400">Active</span>
              ) : (
                <div className="flex gap-2">
                  {plan.stripePriceId ? (
                    <form action={startCheckout.bind(null, plan.key, "STRIPE")}>
                      <Button type="submit" size="sm">
                        Pay with card
                      </Button>
                    </form>
                  ) : null}
                  {plan.razorpayPlanId ? (
                    <form action={startCheckout.bind(null, plan.key, "RAZORPAY")}>
                      <Button type="submit" variant="secondary" size="sm">
                        Pay with Razorpay
                      </Button>
                    </form>
                  ) : null}
                  {!plan.stripePriceId && !plan.razorpayPlanId ? (
                    <span className="text-sm text-slate-400">Not yet available</span>
                  ) : null}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
