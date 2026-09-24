"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Every studio/tool in the reference design gets one nav entry. Only
// Dashboard, Audio Studio and Billing point at real, working pages in this
// dummy-mode build — everything else routes to a small "Coming Soon" page
// (see components/coming-soon.tsx) so no link in the sidebar ever 404s.
//
// Matches the "AutoCanvas" reference design: a flat "Create" row of studios
// (no more Dashboard/Home split, no separate Music/Sound Effects entries —
// those still exist as routes, just not linked from the sidebar anymore)
// followed by one "Workspace" section that folds what used to be "Library"
// and "Account" together.
const NAV_SECTIONS: { label: string; items: { href: string; label: string; icon: string }[] }[] = [
  {
    label: "",
    items: [{ href: "/dashboard", label: "Home", icon: "🏠" }],
  },
  {
    label: "",
    items: [
      { href: "/audio", label: "Audio Studio", icon: "🎧" },
      { href: "/script", label: "Script Studio", icon: "📝" },
      { href: "/images", label: "Image Studio", icon: "🖼️" },
      { href: "/thumbnails", label: "Thumbnail Studio", icon: "🖼" },
      { href: "/videos", label: "Video Studio", icon: "▶️" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/projects", label: "Projects", icon: "📁" },
      { href: "/templates", label: "Templates", icon: "🧩" },
      { href: "/assets", label: "Assets", icon: "🗂️" },
      { href: "/workflows", label: "Workflows", icon: "🔀" },
      { href: "/billing", label: "Billing", icon: "💳" },
      { href: "/settings", label: "Settings", icon: "⚙️" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-white/10 bg-[#05050c]">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-lg font-bold text-white">
          A
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-sm font-bold tracking-tight text-white">
            Auto<span className="text-indigo-400">Canvas</span>
          </span>
          <span className="mt-0.5 text-[10px] text-slate-500">Create. Animate. Share.</span>
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV_SECTIONS.map((section, i) => (
          <div key={section.label || `top-${i}`} className="mb-4">
            {section.label && (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {section.label}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active ? "bg-indigo-500/15 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* "Upgrade to Pro" card — always visible, matches the reference design.
          Dummy mode's billing/checkout flow (see app/(app)/billing) is real
          enough to click through, but there's no actual payment provider
          behind it — see lib/dummy-data.ts's applyDummyCheckout(). */}
      <div className="mx-3 mb-4 rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-blue-500/5 p-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-white">🏆 Upgrade to Pro</p>
        <p className="mt-1 text-xs leading-snug text-slate-400">
          Get more credits, premium voices and advanced features.
        </p>
        <Link
          href="/billing"
          className="mt-3 flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-opacity hover:opacity-90"
        >
          Upgrade Now
        </Link>
      </div>
    </aside>
  );
}
