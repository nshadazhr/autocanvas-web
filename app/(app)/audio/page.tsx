import Link from "next/link";
import { listAudioProjects } from "./actions";
import { getCreditAccount, getCurrentPlanKey, DUMMY_PLANS } from "../../../lib/dummy-data";
import { AudioStudioHero } from "./audio-studio-hero";

// Dummy mode: projects/credits come from lib/dummy-data.ts's in-memory store
// — see that file. Everything below that has a real backing feature (create
// project, project list, generate/import/export inside a project) links to
// the real flow. "Manage Voices" / "Voice Editor" / "My Voices" don't have a
// real feature yet in this preview, so they point at the /voices "coming
// soon" page instead of a dead link. The Popular Voices list on the right is
// illustrative only — there's no real voice catalog behind it yet.

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
        {/* Hero banner + Quick Actions + Create Project modal — client component (see audio-studio-hero.tsx) */}
        <AudioStudioHero />

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
