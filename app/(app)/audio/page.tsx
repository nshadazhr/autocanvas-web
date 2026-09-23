import Link from "next/link";
import { listAudioProjects } from "./actions";
import { getCreditAccount, getCurrentPlanKey, DUMMY_PLANS } from "../../../lib/dummy-data";
import { CreateProjectForm } from "./action-forms";

// Dummy mode: projects/credits come from lib/dummy-data.ts's in-memory store
// — see that file. Everything below that has a real backing feature (create
// project, project list, generate/import/export inside a project) links to
// the real flow. "Manage Voices" / "Voice Editor" / "My Voices" don't have a
// real feature yet in this preview, so they point at the /voices "coming
// soon" page instead of a dead link. The Popular Voices list on the right is
// illustrative only — there's no real voice catalog behind it yet.
const QUICK_ACTIONS = [
  { href: "#create-project", icon: "📥", label: "Import Story", sub: "CSV or paste a script" },
  { href: "/voices", icon: "🎚️", label: "Manage Voices", sub: "Assign character voices" },
  { href: "/voices", icon: "🎙️", label: "Voice Editor", sub: "Fine-tune style & emotion" },
  { href: "#create-project", icon: "🎵", label: "Generate Audio", sub: "Turn scenes into speech" },
  { href: "#create-project", icon: "🔊", label: "Merge Audio", sub: "Combine scenes into one file" },
  { href: "/voices", icon: "⭐", label: "My Voices", sub: "Your saved voice presets" },
];

// Illustrative only — no real voice catalog exists yet in this preview.
const POPULAR_VOICES = [
  { name: "Ava", type: "Female · Warm narrator", icon: "🎤" },
  { name: "Ethan", type: "Male · Deep & calm", icon: "🎙️" },
  { name: "Maya", type: "Female · Energetic", icon: "🗣️" },
  { name: "Leo", type: "Male · Storyteller", icon: "📖" },
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

function projectStatusLabel(sceneCount: number, status: string): string {
  if (sceneCount === 0) return "Draft";
  if (status === "ACTIVE") return "In Progress";
  return "Completed";
}

export default async function AudioStudioPage() {
  const projects = await listAudioProjects();
  const creditAccount = getCreditAccount();
  const planKey = getCurrentPlanKey();
  const plan = DUMMY_PLANS.find((p) => p.key === planKey);
  const monthlyCredits = plan?.monthlyCredits ?? creditAccount.balance;
  const creditsUsed = Math.max(0, monthlyCredits - creditAccount.balance);
  const percentUsed = monthlyCredits > 0 ? Math.min(100, Math.round((creditsUsed / monthlyCredits) * 100)) : 0;
  const totalScenes = projects.reduce((sum, p) => sum + (p.audioProject?._count.scenes ?? 0), 0);

  const ringStyle = {
    background: `conic-gradient(#818cf8 ${percentUsed * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <div className="flex flex-1 flex-col gap-8">
        {/* Hero banner */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600/20 via-indigo-500/10 to-transparent px-8 py-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">Audio Studio</p>
          <h1 className="mt-2 max-w-lg text-3xl font-bold text-white sm:text-4xl">
            Turn Your Stories into{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
              Realistic Voices
            </span>
          </h1>
          <p className="mt-3 max-w-md text-sm text-slate-400">
            Generate high-quality AI narration for your stories, with emotions, multiple characters, and
            natural-sounding narration.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="#create-project"
              className="rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-opacity hover:opacity-90"
            >
              + Create New Project
            </Link>
            <span
              className="cursor-not-allowed rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-400"
              title="Demo only — no walkthrough video in this preview"
            >
              ▶ Watch Tutorial
            </span>
          </div>
          <span className="pointer-events-none absolute -right-6 -top-6 text-[120px] opacity-10 sm:text-[160px]">
            🎧
          </span>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {QUICK_ACTIONS.map((item, i) => (
              <Link
                key={`${item.label}-${i}`}
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
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Recent Projects</h2>
          {projects.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <p className="text-sm text-slate-400">No projects yet — create your first one below.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Project</th>
                    <th className="px-4 py-3 font-medium">Scenes</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {projects.map((project) => {
                    const sceneCount = project.audioProject?._count.scenes ?? 0;
                    return (
                      <tr key={project.id} className="transition-colors hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <Link
                            href={`/audio/${project.audioProject?.id}`}
                            className="font-medium text-white hover:text-indigo-300"
                          >
                            {project.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {sceneCount} scene{sceneCount === 1 ? "" : "s"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={projectStatusLabel(sceneCount, project.status)} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/audio/${project.audioProject?.id}`}
                            className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
                          >
                            Open →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create project — real form, anchored from the hero/quick-action buttons above */}
        <div id="create-project" className="scroll-mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Create New Project</h2>
          <CreateProjectForm />
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
              <p className="text-lg font-semibold text-white">{projects.length}</p>
              <p className="text-xs text-slate-500">Projects</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{totalScenes}</p>
              <p className="text-xs text-slate-500">Scenes</p>
            </div>
          </div>
        </div>

        {/* Popular Voices — illustrative only, no real voice catalog yet */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="text-sm font-semibold text-white">Popular Voices</h3>
          <ul className="mt-4 flex flex-col gap-3">
            {POPULAR_VOICES.map((voice) => (
              <li key={voice.name} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10 text-sm">
                  {voice.icon}
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{voice.name}</p>
                  <p className="text-xs text-slate-500">{voice.type}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/voices" className="mt-4 inline-block text-xs font-medium text-indigo-400 hover:text-indigo-300">
            Browse all voices →
          </Link>
        </div>

        {/* Pro Tip */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <span className="text-2xl">💡</span>
          <h3 className="mt-2 text-sm font-semibold text-white">Pro Tip</h3>
          <p className="mt-1 text-xs text-slate-400">
            Import a CSV with a &ldquo;text&rdquo; column to add many scenes at once, then press{" "}
            <span className="text-slate-300">Generate all pending scenes</span> to narrate the whole story in one go.
          </p>
        </div>
      </div>
    </div>
  );
}
