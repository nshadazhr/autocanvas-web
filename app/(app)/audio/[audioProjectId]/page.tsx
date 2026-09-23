import Link from "next/link";
import { getAudioProjectDetail } from "../actions";
import {
  AddSceneForm,
  CsvImportForm,
  GenerateSceneButton,
  GenerateAllButton,
  DeleteSceneButton,
  ExportForm,
  PlayOrDownloadLink,
} from "../action-forms";

const SCENE_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  QUEUED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  PROCESSING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
};

function SceneStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${SCENE_STATUS_STYLES[status] ?? SCENE_STATUS_STYLES.PENDING}`}
    >
      {status}
    </span>
  );
}

export default async function AudioProjectDetailPage({ params }: { params: { audioProjectId: string } }) {
  const audioProject = await getAudioProjectDetail(params.audioProjectId);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{audioProject.project.name}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {audioProject.scenes.length} scene{audioProject.scenes.length === 1 ? "" : "s"} · default format{" "}
            {audioProject.defaultFormat}
          </p>
        </div>
        <Link href="/audio" className="text-sm font-medium text-slate-400 hover:text-white">
          ← All projects
        </Link>
      </div>

      <section className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <CsvImportForm audioProjectId={audioProject.id} />
        </div>
        <div className="flex-1">
          <AddSceneForm audioProjectId={audioProject.id} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">Scenes</h2>
          {audioProject.scenes.length > 0 && <GenerateAllButton audioProjectId={audioProject.id} />}
        </div>

        {audioProject.scenes.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <p className="text-sm font-medium text-white">No scenes yet</p>
            <p className="mt-1 text-sm text-slate-400">Add one manually or import a CSV above to get started.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {audioProject.scenes.map((scene) => {
              const latestGeneration = scene.generations[0];
              return (
                <li key={scene.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-300">Scene {scene.sceneNumber}</span>
                        {scene.title && <span className="text-sm text-slate-500">— {scene.title}</span>}
                        <SceneStatusBadge status={scene.status} />
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-400">{scene.text}</p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-3">
                      {scene.status === "COMPLETED" && latestGeneration?.storageKey && (
                        <PlayOrDownloadLink storageKey={latestGeneration.storageKey} label="audio" />
                      )}
                      {(scene.status === "PENDING" || scene.status === "FAILED") && (
                        <GenerateSceneButton sceneId={scene.id} />
                      )}
                      <DeleteSceneButton audioProjectId={audioProject.id} sceneId={scene.id} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-white">Export</h2>
        <ExportForm
          audioProjectId={audioProject.id}
          scenes={audioProject.scenes.map((s) => ({ id: s.id, sceneNumber: s.sceneNumber, title: s.title, status: s.status }))}
        />
      </section>

      {audioProject.exports.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-white">Past exports</h2>
          <ul className="flex flex-col gap-2">
            {audioProject.exports.map((exp) => (
              <li
                key={exp.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <div className="text-sm text-slate-400">
                  {exp.type === "MERGED" ? "Merged export" : "Chunk export"} · {exp.sceneIds.length} scene
                  {exp.sceneIds.length === 1 ? "" : "s"} · {new Date(exp.createdAt).toLocaleString()}
                </div>
                <PlayOrDownloadLink storageKey={exp.storageKey} label="file" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
