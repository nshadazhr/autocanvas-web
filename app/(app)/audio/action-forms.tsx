"use client";

import { useState, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  createAudioProject,
  addSceneFormAction,
  importScenesFromCsvFormAction,
  generateSceneAudioFormAction,
  generateAllPendingScenesFormAction,
  requestExportFormAction,
  deleteScene,
  getSignedAudioUrl,
  type ActionResult,
  type ImportScenesResult,
} from "./actions";

// ─────────────────────────────────────────────────────────────────────────
// Small client components wrapping the Server Actions in actions.ts with
// `useFormState`/`useFormStatus` — this is the ONLY reason these need
// "use client" at all; every actual mutation still runs server-side. Styled
// for the dark Audio Studio shell (see app/(app)/layout.tsx) — these are
// only ever rendered inside that shell, on the audio project pages.
// ─────────────────────────────────────────────────────────────────────────

const primaryButtonClasses =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

function SubmitButton({ children, pendingChildren, className }: { children: React.ReactNode; pendingChildren: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className ?? primaryButtonClasses}>
      {pending ? pendingChildren : children}
    </button>
  );
}

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-2 text-sm text-red-400">{message}</p>;
}

export function CreateProjectForm() {
  const [state, formAction] = useFormState<ActionResult<{ audioProjectId: string }> | null, FormData>(createAudioProject, null);
  return (
    <form
      action={formAction}
      className="flex flex-col items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center"
    >
      <input
        type="text"
        name="name"
        placeholder='New project name (e.g. "Episode 12 Narration")'
        required
        className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none sm:w-80"
      />
      <SubmitButton pendingChildren="Creating...">Create project</SubmitButton>
      <ErrorText message={state?.message} />
    </form>
  );
}

export function AddSceneForm({ audioProjectId }: { audioProjectId: string }) {
  const action = addSceneFormAction.bind(null, audioProjectId);
  const [state, formAction] = useFormState<ActionResult | null, FormData>(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        const result = await formAction(formData);
        if (formRef.current) formRef.current.reset();
        return result;
      }}
      className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4"
    >
      <div className="flex gap-2">
        <input
          type="text"
          name="title"
          placeholder="Title (optional)"
          className="w-48 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
        />
      </div>
      <textarea
        name="text"
        placeholder="Scene text..."
        required
        rows={2}
        className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
      />
      <div>
        <SubmitButton pendingChildren="Adding...">Add scene</SubmitButton>
      </div>
      <ErrorText message={state?.message} />
    </form>
  );
}

export function CsvImportForm({ audioProjectId }: { audioProjectId: string }) {
  const action = importScenesFromCsvFormAction.bind(null, audioProjectId);
  const [state, formAction] = useFormState<ActionResult<ImportScenesResult> | null, FormData>(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <label className="text-sm font-medium text-slate-300">Import scenes from CSV</label>
      <input
        type="file"
        name="file"
        accept=".csv,text/csv"
        required
        className="text-sm text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-white/20"
      />
      <p className="text-xs text-slate-500">
        Columns: text (required), title, sceneNumber, voiceName, character, style, emotion, language, targetDuration.
      </p>
      <div>
        <SubmitButton pendingChildren="Importing...">Import CSV</SubmitButton>
      </div>
      {state && state.ok && (
        <p className="text-sm text-emerald-400">
          Imported {state.data?.imported ?? 0} scene{state.data?.imported === 1 ? "" : "s"}.
        </p>
      )}
      <ErrorText message={state && !state.ok ? state.message : undefined} />
      {state?.data && state.data.rowErrors.length > 0 && (
        <ul className="list-inside list-disc text-sm text-amber-400">
          {state.data.rowErrors.map((rowError, i) => (
            <li key={i}>{rowError}</li>
          ))}
        </ul>
      )}
    </form>
  );
}

export function GenerateSceneButton({ sceneId }: { sceneId: string }) {
  const action = generateSceneAudioFormAction.bind(null, sceneId);
  const [state, formAction] = useFormState<ActionResult | null, FormData>(action, null);
  return (
    <form action={formAction} className="inline-flex flex-col items-start">
      <SubmitButton
        pendingChildren="Queuing..."
        className="rounded-full bg-indigo-500/15 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Generate
      </SubmitButton>
      <ErrorText message={state && !state.ok ? state.message : undefined} />
    </form>
  );
}

export function GenerateAllButton({ audioProjectId }: { audioProjectId: string }) {
  const action = generateAllPendingScenesFormAction.bind(null, audioProjectId);
  const [state, formAction] = useFormState<ActionResult<{ queued: number; failures: string[] }> | null, FormData>(action, null);
  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <SubmitButton pendingChildren="Queuing all...">Generate all pending scenes</SubmitButton>
      {state?.data && (
        <p className="text-sm text-slate-400">
          Queued {state.data.queued} scene{state.data.queued === 1 ? "" : "s"}.
          {state.data.failures.length > 0 && ` ${state.data.failures.length} failed to queue.`}
        </p>
      )}
      {state?.data && state.data.failures.length > 0 && (
        <ul className="list-inside list-disc text-sm text-red-400">
          {state.data.failures.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      )}
    </form>
  );
}

export function DeleteSceneButton({ audioProjectId, sceneId }: { audioProjectId: string; sceneId: string }) {
  const action = deleteScene.bind(null, audioProjectId, sceneId);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this scene? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="text-xs font-medium text-red-400 hover:text-red-300">
        Delete
      </button>
    </form>
  );
}

export function ExportForm({ scenes, audioProjectId }: { audioProjectId: string; scenes: Array<{ id: string; sceneNumber: number; title: string | null; status: string }> }) {
  const action = requestExportFormAction.bind(null, audioProjectId);
  const [state, formAction] = useFormState<ActionResult | null, FormData>(action, null);
  const completedScenes = scenes.filter((s) => s.status === "COMPLETED");

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm font-medium text-slate-300">Export</p>
      {completedScenes.length === 0 ? (
        <p className="text-sm text-slate-500">No completed scenes yet — generate audio first.</p>
      ) : (
        <>
          <div className="flex max-h-40 flex-col gap-1 overflow-y-auto">
            {completedScenes.map((scene) => (
              <label key={scene.id} className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" name="sceneIds" value={scene.id} defaultChecked className="accent-indigo-500" />
                Scene {scene.sceneNumber}
                {scene.title ? ` — ${scene.title}` : ""}
              </label>
            ))}
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-300">
            <label className="flex items-center gap-1">
              <input type="radio" name="type" value="MERGED" defaultChecked className="accent-indigo-500" /> Merged (single file)
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name="type" value="CHUNK" className="accent-indigo-500" /> Per-scene chunk
            </label>
          </div>
          <div>
            <SubmitButton pendingChildren="Queuing export...">Request export</SubmitButton>
          </div>
        </>
      )}
      <ErrorText message={state && !state.ok ? state.message : undefined} />
      {state?.ok && <p className="text-sm text-emerald-400">Export queued — it will appear below once ready.</p>}
    </form>
  );
}

export function PlayOrDownloadLink({ storageKey, label }: { storageKey: string; label: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function reveal() {
    setLoading(true);
    try {
      const signedUrl = await getSignedAudioUrl(storageKey);
      setUrl(signedUrl);
    } finally {
      setLoading(false);
    }
  }

  if (url) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="text-sm font-medium text-indigo-300 hover:text-indigo-200">
        Open {label}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={reveal}
      disabled={loading}
      className="text-sm font-medium text-indigo-300 hover:text-indigo-200 disabled:opacity-50"
    >
      {loading ? "Loading..." : `Get ${label} link`}
    </button>
  );
}
