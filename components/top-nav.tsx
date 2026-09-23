import Link from "next/link";
import { signOut } from "@platform/auth";
import { Button } from "./ui/button";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/audio", label: "Audio Studio" },
  { href: "/billing", label: "Billing" },
];

export function TopNav({
  userName,
  creditBalance,
}: {
  userName: string;
  creditBalance: number;
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight text-slate-900">
            AI Creator
          </Link>
          <nav className="hidden items-center gap-4 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-slate-500 sm:inline">
            <strong className="font-semibold text-slate-900">{creditBalance.toLocaleString()}</strong> credits
          </span>
          <span className="hidden text-sm text-slate-600 md:inline">{userName}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit" variant="secondary" size="sm">
              Log out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
