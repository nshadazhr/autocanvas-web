"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Every studio/tool in the reference design gets one nav entry. Only
// Dashboard, Audio Studio and Billing point at real, working pages in this
// dummy-mode build — everything else routes to a small "Coming Soon" page
// (see components/coming-soon.tsx) so no link in the sidebar ever 404s.
//
// Note: the reference design listed "Home" and "Dashboard" as two separate
// entries pointing at the same kind of overview page — collapsed into one
// "Dashboard" entry here per instruction, since having both was redundant.
const NAV_SECTIONS: { label: string; items: { href: string; label: string; icon: string }[] }[] = [
  {
    label: "",
    items: [{ href: "/dashboard", label: "Dashboard", icon: "🏠" }],
  },
  {
    label: "Create",
    items: [
      { href: "/audio", label: "Audio Studio", icon: "🎵" },
      { href: "/script", label: "Script Studio", icon: "📝" },
      { href: "/images", label: "Image Studio", icon: "🖼️" },
      { href: "/thumbnails", label: "Thumbnail Studio", icon: "🖼" },
      { href: "/videos", label: "Video Studio", icon: "▶️" },
      { href: "/music", label: "Music", icon: "🎶" },
      { href: "/sound-effects", label: "Sound Effects", icon: "🔊" },
    ],
  },
  {
    label: "Library",
    items: [
      { href: "/projects", label: "Projects", icon: "📁" },
      { href: "/assets", label: "Assets", icon: "🗂️" },
      { href: "/templates", label: "Templates", icon: "🧩" },
      { href: "/workflows", label: "Workflows", icon: "🔀" },
    ],
  },
  {
    label: "Account",
    items: [
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
            AI Creator<span className="text-indigo-400"> Platform</span>
          </span>
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label || "top"} className="mb-4">
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
    </aside>
  );
}
