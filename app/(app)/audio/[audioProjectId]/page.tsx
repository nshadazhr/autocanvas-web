import Link from "next/link";
import { getAudioProjectDetail, checkCredits } from "../actions";
import { ProjectWorkspace } from "./project-workspace";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.round(mins / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default async function AudioProjectDetailPage({ params }: { params: { audioProjectId: string } }) {
  const audioProject = await getAudioProjectDetail(params.audioProjectId);

  // "Credits Required" in the reference design tracks what's left to
  // generate, not the whole project — so it's based on non-completed
  // scenes' characters, matching what hitting Generate would actually cost.
  const pendingCharacters = audioProject.scenes
    .filter((s) => s.status !== "COMPLETED")
    .reduce((sum, s) => sum + s.characters, 0);
  const creditStats = await checkCredits(pendingCharacters);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/audio" className="text-sm font-medium text-slate-400 hover:text-white">
            ← Back to Projects
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-white">{audioProject.project.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Saved {timeAgo(audioProject.lastSavedAt)} · {audioProject.defaultFormat.toUpperCase()}
            {audioProject.language && <> · {audioProject.language}</>}
          </p>
        </div>
      </div>

      <ProjectWorkspace audioProject={audioProject} creditStats={creditStats} />
    </div>
  );
}
