import { signOut } from "@platform/auth";

// Server component — no client state needed. The search box is visual only
// (dummy mode has no real cross-studio search index yet) and the
// notification bell is a static icon with no real notification feed
// behind it; both render honestly as non-functional so nothing pretends
// to work that doesn't.
export function AppTopbar({
  userName,
  planLabel,
  creditBalance,
}: {
  userName: string;
  planLabel: string;
  creditBalance: number;
}) {
  return (
    <header className="flex h-16 items-center gap-4 border-b border-white/10 bg-[#05050c] px-6">
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400">
        <span>🔍</span>
        <input
          type="text"
          placeholder="Search projects, files, templates..."
          disabled
          className="w-full bg-transparent text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none"
        />
      </div>

      <span className="flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1.5 text-sm font-medium text-indigo-300">
        💰 {creditBalance.toLocaleString()} credits
      </span>

      <div className="flex flex-shrink-0 flex-col items-end leading-tight">
        <span className="text-sm font-medium text-white">{userName}</span>
        <span className="text-xs text-slate-500">{planLabel}</span>
      </div>

      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-sm">🔔</span>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
        className="flex-shrink-0"
      >
        <button
          type="submit"
          className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          Log out
        </button>
      </form>
    </header>
  );
}
