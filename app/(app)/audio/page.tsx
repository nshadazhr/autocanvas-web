import Link from "next/link";
import { listAudioProjects } from "./actions";
import { CreateProjectForm } from "./action-forms";
import { Badge } from "../../../components/ui/badge";
import { EmptyState } from "../../../components/ui/empty-state";

export default async function AudioProjectsPage() {
  const projects = await listAudioProjects();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Audio Studio</h1>
        <p className="mt-1 text-sm text-slate-500">
          Turn a script into narrated audio — import a CSV of scenes or add them one at a time.
        </p>
      </div>

      <CreateProjectForm />

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project above to start generating narrated audio."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/audio/${project.audioProject!.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors hover:border-slate-300"
              >
                <div>
                  <p className="font-medium text-slate-900">{project.name}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-sm text-slate-500">
                    {project.audioProject?._count.scenes ?? 0} scene
                    {project.audioProject?._count.scenes === 1 ? "" : "s"}
                    <Badge>{project.status}</Badge>
                  </p>
                </div>
                <span className="text-sm text-slate-400">Open →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
