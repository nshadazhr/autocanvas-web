import type { ReactNode } from "react";
import { auth } from "@platform/auth";
import { getCreditAccount, getCurrentPlanKey, DUMMY_PLANS } from "../../lib/dummy-data";
import { Sidebar } from "../../components/sidebar";
import { AppTopbar } from "../../components/app-topbar";

/**
 * Shared shell for every signed-in page (dashboard, audio studio, billing,
 * and every "coming soon" placeholder). Middleware (`middleware.ts`) already
 * guarantees `auth()` resolves to a real session here — anything under this
 * route group is never reached while logged out — so this layout only needs
 * to fetch the bits the sidebar/topbar themselves display (name, plan,
 * live credit balance) and render children next to the fixed dark sidebar.
 *
 * Dummy mode: credits/plan come from `lib/dummy-data.ts`'s in-memory store
 * instead of `prisma.creditAccount.findUnique` — see that file.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const user = session!.user;

  const creditAccount = getCreditAccount();
  const planKey = getCurrentPlanKey();
  const plan = DUMMY_PLANS.find((p) => p.key === planKey);
  const planLabel = plan ? `${plan.name} Plan` : "Free Plan";

  return (
    <div className="flex min-h-screen bg-[#05050c]">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <AppTopbar
          userName={user.name ?? user.email ?? "Account"}
          planLabel={planLabel}
          creditBalance={creditAccount.balance}
        />
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
