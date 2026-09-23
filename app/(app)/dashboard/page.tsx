import { auth } from "@platform/auth";
import { prisma } from "@platform/database";
import { getCurrentPlanKey } from "../billing/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, StatTile } from "../../../components/ui/card";
import { LinkButton } from "../../../components/ui/button";

const ROLE_LABEL: Record<string, string> = {
  USER: "Member",
  ADMIN: "Admin",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null; // middleware already redirects; this satisfies TS

  const [creditAccount, planKey] = await Promise.all([
    prisma.creditAccount.findUnique({
      where: { userId: session.user.id },
      select: { balance: true, reserved: true },
    }),
    getCurrentPlanKey(),
  ]);

  const balance = creditAccount ? Number(creditAccount.balance) : 0;
  const reserved = creditAccount ? Number(creditAccount.reserved) : 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome back, {session.user.name ?? session.user.email}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Here&apos;s where things stand on your account.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Credits available"
          value={balance.toLocaleString()}
          hint={reserved > 0 ? `${reserved.toLocaleString()} reserved for in-flight jobs` : "No jobs in flight"}
        />
        <StatTile label="Current plan" value={planKey ? <span className="capitalize">{planKey}</span> : "Free"} />
        <StatTile label="Role" value={ROLE_LABEL[session.user.role] ?? session.user.role} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Audio Studio</CardTitle>
            <CardDescription>Turn scripts into narrated audio — import a CSV or write scenes by hand.</CardDescription>
          </CardHeader>
          <CardContent>
            <LinkButton href="/audio" size="sm">
              Open Audio Studio →
            </LinkButton>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing &amp; Plans</CardTitle>
            <CardDescription>Check your plan, top up credits, or switch to a bigger plan.</CardDescription>
          </CardHeader>
          <CardContent>
            <LinkButton href="/billing" size="sm" variant="secondary">
              Manage billing →
            </LinkButton>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
