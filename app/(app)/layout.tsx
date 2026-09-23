import type { ReactNode } from "react";
import { auth } from "@platform/auth";
import { prisma } from "@platform/database";
import { TopNav } from "../../components/top-nav";

/**
 * Shared shell for every signed-in page (dashboard, audio studio, billing).
 * Middleware (`middleware.ts`) already guarantees `auth()` resolves to a
 * real session here — anything under this route group is never reached
 * while logged out — so this layout only needs to fetch the bits the nav
 * bar itself displays (name + live credit balance) and render children.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const user = session!.user;

  const creditAccount = await prisma.creditAccount.findUnique({
    where: { userId: user.id },
    select: { balance: true },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav userName={user.name ?? user.email ?? "Account"} creditBalance={creditAccount ? Number(creditAccount.balance) : 0} />
      <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
    </div>
  );
}
