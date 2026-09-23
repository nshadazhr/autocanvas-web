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
import { StatusBadge } from "../../../../components/ui/badge";
import { EmptyState } from "../../../../components/ui/empty-state";

export default async function AudioProjectDetailPage({ params }: { params: { audioProjectId: string } }) {
  const audioProject = await getAudioProjectDetail(params.audioProjectId);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{audioProject.project.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {audioProject.scenes.length} scene{audioProject.scenes.length === 1 ? "" : "s"} · default format{" "}
            {audioProject.defaultFormat}
          </p>
        </div>
        <Link href="/audio" className="text-sm font-medium text-slate-500 hover:text-slate-900">
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
          <h2 className="text-lg font-medium text-slate-900">Scenes</h2>
          {audioProject.scenes.length > 0 && <GenerateAllButton audioProjectId={audioProject.id} />}
        </div>

        {audioProject.scenes.length === 0 ? (
          <EmptyState
            title="No scenes yet"
            description="Add one manually or import a CSV above to get started."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {audioProject.scenes.map((scene) => {
              const latestGeneration = scene.generations[0];
              return (
                <li key={scene.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">Scene {scene.sceneNumber}</span>
                        {scene.title && <span className="text-sm text-slate-500">— {scene.title}</span>}
                        <StatusBadge status={scene.status} />
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-600">{scene.text}</p>
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
        <h2 className="text-lg font-medium text-slate-900">Export</h2>
        <ExportForm
          audioProjectId={audioProject.id}
          scenes={audioProject.scenes.map((s) => ({ id: s.id, sceneNumber: s.sceneNumber, title: s.title, status: s.status }))}
        />
      </section>

      {audioProject.exports.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-slate-900">Past exports</h2>
          <ul className="flex flex-col gap-2">
            {audioProject.exports.map((exp) => (
              <li
                key={exp.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <div className="text-sm text-slate-600">
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
