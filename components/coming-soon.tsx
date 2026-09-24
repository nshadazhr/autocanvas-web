import Link from "next/link";

// Shared placeholder for every sidebar destination that doesn't have a
// real feature behind it yet in this dummy-mode build (only Audio Studio,
// Dashboard and Billing are real). Rendering this instead of leaving the
// link unbuilt means nothing in the sidebar ever 404s.
export function ComingSoon({
  title,
  icon,
  description,
}: {
  title: string;
  icon: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-3xl">
        {icon}
      </span>
      <div>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        <p className="mt-2 max-w-sm text-sm text-slate-400">{description}</p>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-400">
        🚧 Coming soon
      </span>
      <Link
        href="/dashboard"
        className="mt-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-opacity hover:opacity-90"
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
}
