import Link from "next/link";
import { auth } from "@platform/auth";
import {
  getCreditAccount,
  getCurrentPlanKey,
  DUMMY_PLANS,
  listAudioProjects,
  getAudioProjectDetail,
} from "../../../lib/dummy-data";

// Dummy mode: credits/plan/projects all come from lib/dummy-data.ts's
// in-memory store instead of real Postgres/Stripe-backed queries — see that
// file. Real values (credit balance, plan, the one seeded Audio Studio
// project and its scene counts) are used wherever they exist; the other
// "Create" studios (Script/Image/Thumbnail/Video) don't have any real data
// behind them yet in this preview, so the Quick Start cards and the extra
// rows in "Recent Projects" below are clearly-labelled illustrative filler
// so the dashboard reads the way the reference design does, without
// pretending those studios actually exist.
const QUICK_START = [
  { href: "/audio", icon: "🎵", label: "Create Audio", sub: "Narrate a script" },
  { href: "/script", icon: "📝", label: "Generate Script", sub: "Story from an idea" },
  { href: "/images", icon: "🖼️", label: "Create Images", sub: "Characters & scenes" },
  { href: "/thumbnails", icon: "🖼", label: "Create Thumbnails", sub: "Eye-catching covers" },
  { href: "/videos", icon: "▶️", label: "Create Videos", sub: "Full video cuts" },
  { href: "/templates", icon: "🧩", label: "Browse Templates", sub: "Jump-start a project" },
];

// Illustrative-only rows — no real Script/Image/Thumbnail/Video Studio
// exists yet, so these are fabricated to match the reference design's
// "populated" look. Not sourced from any data store.
const FILLER_PROJECTS = [
  { name: "Village Story Script", type: "Script", icon: "📝", status: "Completed", when: "2 hours ago", href: "/script" },
  { name: "Character Concept Art", type: "Image", icon: "🖼️", status: "Completed", when: "5 hours ago", href: "/images" },
  { name: "Episode 1 Thumbnail", type: "Thumbnail", icon: "🖼", status: "Completed", when: "1 day ago", href: "/thumbnails" },
  { name: "Teaser Trailer Cut", type: "Video", icon: "▶️", status: "Draft", when: "2 days ago", href: "/videos" },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "In Progress": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status] ?? styles.Draft}`}>
      {status}
    </span>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null; // middleware already redirects; this satisfies TS

  const creditAccount = getCreditAccount();
  const planKey = getCurrentPlanKey();
  const plan = DUMMY_PLANS.find((p) => p.key === planKey);

  const monthlyCredits = plan?.monthlyCredits ?? creditAccount.balance;
  const creditsUsed = Math.max(0, monthlyCredits - creditAccount.balance);
  const percentUsed = monthlyCredits > 0 ? Math.min(100, Math.round((creditsUsed / monthlyCredits) * 100)) : 0;

  const audioProjects = listAudioProjects();
  const firstAudioProject = audioProjects[0] ?? null;
  const audioDetail = firstAudioProject?.audioProject
    ? getAudioProjectDetail(firstAudioProject.audioProject.id)
    : null;
  const completedScenes = audioDetail ? audioDetail.scenes.filter((s) => s.status === "COMPLETED").length : 0;
  const totalScenes = audioDetail ? audioDetail.scenes.length : 0;
  const audioStatusLabel = totalScenes === 0 ? "Draft" : completedScenes === totalScenes ? "Completed" : "In Progress";

  // Donut ring — real percentUsed drawn via conic-gradient, no chart library needed.
  const ringStyle = {
    background: `conic-gradient(#818cf8 ${percentUsed * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <div className="flex flex-1 flex-col gap-8">
        {/* Hero banner */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600/20 via-indigo-500/10 to-transparent px-8 py-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">
            AI Powered Creative Platform
          </p>
          <h1 className="mt-2 max-w-lg text-3xl font-bold text-white sm:text-4xl">
            Turn Your Ideas Into{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
              Amazing Content
            </span>
          </h1>
          <p className="mt-3 max-w-md text-sm text-slate-400">
            Welcome back, {session.user.name ?? session.user.email}. Pick up where you left off or start something new.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/audio"
              className="rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-opacity hover:opacity-90"
            >
              + Create New Project
            </Link>
            <span
              className="cursor-not-allowed rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-400"
              title="Demo only — no walkthrough video in this preview"
            >
              ▶ Watch Demo
            </span>
          </div>
          <span className="pointer-events-none absolute -right-6 -top-6 text-[120px] opacity-10 sm:text-[160px]">
            🎨
          </span>
        </div>

        {/* Quick Start */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Quick Start</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {QUICK_START.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-lg">
                  {item.icon}
                </span>
                <span className="text-sm font-medium text-white">{item.label}</span>
                <span className="text-xs text-slate-500">{item.sub}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Projects */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Recent Projects</h2>
            <Link href="/audio" className="text-xs font-medium text-indigo-400 hover:text-indigo-300">
              View all →
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {firstAudioProject && (
                  <tr className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <Link
                        href={`/audio/${firstAudioProject.audioProject?.id}`}
                        className="font-medium text-white hover:text-indigo-300"
                      >
                        {firstAudioProject.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-400">🎵 Audio</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={audioStatusLabel} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">Just now</td>
                  </tr>
                )}
                {FILLER_PROJECTS.map((p) => (
                  <tr key={p.name} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <Link href={p.href} className="font-medium text-white hover:text-indigo-300">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {p.icon} {p.type}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Only &ldquo;{firstAudioProject?.name}&rdquo; is a real project in this preview — the other rows above are
            illustrative, since Script/Image/Thumbnail/Video Studio aren&apos;t built yet.
          </p>
        </div>
      </div>

      {/* Right column */}
      <div className="flex w-full flex-col gap-5 lg:w-80">
        {/* Usage Overview */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="text-sm font-semibold text-white">Usage Overview</h3>
          <div className="mt-4 flex items-center justify-center">
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full" style={ringStyle}>
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[#0a0a14]">
                <span className="text-xl font-bold text-white">{percentUsed}%</span>
                <span className="text-[10px] text-slate-500">used</span>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-slate-400">
            {creditsUsed.toLocaleString()} / {monthlyCredits.toLocaleString()} credits this month
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-center">
            <div>
              <p className="text-lg font-semibold text-white">{audioProjects.length}</p>
              <p className="text-xs text-slate-500">Projects</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{completedScenes}</p>
              <p className="text-xs text-slate-500">Audio files</p>
            </div>
          </div>
        </div>

        {/* Upgrade to Pro */}
        <div className="rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/10 to-transparent p-6">
          <span className="text-2xl">✨</span>
          <h3 className="mt-2 text-sm font-semibold text-white">
            {plan?.key === "business" ? "You're on Business" : "Upgrade to Pro"}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            {plan?.key === "business"
              ? "You already have the highest monthly credit allotment available."
              : "Get more monthly credits and unlock higher-priority generation."}
          </p>
          <Link
            href="/billing"
            className="mt-4 inline-flex rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-opacity hover:opacity-90"
          >
            Manage billing →
          </Link>
        </div>

        {/* Need Help */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <span className="text-2xl">💬</span>
          <h3 className="mt-2 text-sm font-semibold text-white">Need Help?</h3>
          <p className="mt-1 text-xs text-slate-400">
            This is a preview build — support isn&apos;t connected yet, but Audio Studio is fully working end to end.
          </p>
        </div>
      </div>
    </div>
  );
}
