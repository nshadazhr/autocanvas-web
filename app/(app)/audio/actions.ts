"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { backendFetch, BackendApiError } from "../../../lib/backend-client";

// ─────────────────────────────────────────────────────────────────────────
// Chunk 10: Audio Studio's Server Actions no longer touch
// @platform/database/@platform/queue/@platform/ai-core/@platform/storage/
// @modules/audio directly — every one of those imports (and the workspace
// dependencies they came from, see apps/web/package.json) is gone from this
// app now. Every function below has the EXACT same exported name and
// signature it had before this chunk (action-forms.tsx and both audio pages
// needed zero changes) — the only thing that changed is that the body of
// each one is now an HTTP call to apps/backend via `backendFetch` (see
// apps/web/lib/backend-client.ts) instead of a direct Prisma/queue call.
//
// Next.js-specific glue (`redirect`, `revalidatePath`) still lives here,
// same as before — those are rendering concerns apps/backend has no
// business knowing about. `ActionResult` is still the shape every form
// component in action-forms.tsx expects; `translateError` below is the one
// new piece of glue that turns a thrown `BackendApiError` back into that
// shape.
// ─────────────────────────────────────────────────────────────────────────

export interface ActionResult<T = void> {
  ok: boolean;
  message?: string;
  data?: T;
}

function translateError(err: unknown, fallback: string): ActionResult<never> {
  if (err instanceof BackendApiError) {
    return { ok: false, message: err.message };
  }
  return { ok: false, message: err instanceof Error ? err.message : fallback };
}

export type SceneStatus = "PENDING" | "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

interface ProjectSummaryRow {
  id: string;
  name: string;
  status: string;
  audioProject: { id: string; _count: { scenes: number } } | null;
}

interface AudioSceneDetailRow {
  id: string;
  orderIndex: number;
  status: SceneStatus;
  sceneNumber: number;
  title: string | null;
  text: string;
  generations: Array<{ storageKey: string | null }>;
}

interface AudioExportRow {
  id: string;
  type: string;
  sceneIds: string[];
  storageKey: string;
  // A real `Date` on the backend's side, but everything crossing the HTTP
  // boundary is JSON — `JSON.stringify`/`JSON.parse` never produce `Date`
  // instances, so this arrives here as an ISO string. `new Date(...)` (see
  // the detail page) happily accepts either, but typing it as `Date` here
  // would be a lie about what's actually on the wire.
  createdAt: string;
}

interface AudioProjectDetail {
  id: string;
  defaultFormat: string;
  project: { id: string; name: string; ownerId: string };
  scenes: AudioSceneDetailRow[];
  exports: AudioExportRow[];
}

// ─────────────────────────────────────────────────────────────────────────
// Projects
// ─────────────────────────────────────────────────────────────────────────

export async function listAudioProjects(): Promise<ProjectSummaryRow[]> {
  return backendFetch<ProjectSummaryRow[]>("/audio/projects");
}

/**
 * Signature matches `useFormState`'s `(prevState, formData) => nextState` —
 * same reasoning as before this chunk (see the git history on this file).
 */
export async function createAudioProject(
  _prevState: ActionResult<{ audioProjectId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ audioProjectId: string }>> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { ok: false, message: "Project name is required." };
  }

  let result: { audioProjectId: string };
  try {
    result = await backendFetch<{ audioProjectId: string }>("/audio/projects", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  } catch (err) {
    return translateError(err, "Failed to create project.");
  }

  revalidatePath("/audio");
  redirect(`/audio/${result.audioProjectId}`);
}

export async function getAudioProjectDetail(audioProjectId: string): Promise<AudioProjectDetail> {
  return backendFetch<AudioProjectDetail>(`/audio/projects/${audioProjectId}`);
}

// ─────────────────────────────────────────────────────────────────────────
// Scenes: manual add + CSV import
// ─────────────────────────────────────────────────────────────────────────

export async function addScene(audioProjectId: string, formData: FormData): Promise<ActionResult> {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) {
    return { ok: false, message: "Scene text cannot be empty." };
  }
  const title = String(formData.get("title") ?? "").trim() || undefined;

  try {
    await backendFetch(`/audio/projects/${audioProjectId}/scenes`, {
      method: "POST",
      body: JSON.stringify({ text, title }),
    });
  } catch (err) {
    return translateError(err, "Failed to add scene.");
  }

  revalidatePath(`/audio/${audioProjectId}`);
  return { ok: true };
}

export async function deleteScene(audioProjectId: string, sceneId: string): Promise<ActionResult> {
  try {
    await backendFetch(`/audio/projects/${audioProjectId}/scenes/${sceneId}`, { method: "DELETE" });
  } catch (err) {
    return translateError(err, "Failed to delete scene.");
  }

  revalidatePath(`/audio/${audioProjectId}`);
  return { ok: true };
}

export interface ImportScenesResult {
  imported: number;
  rowErrors: string[];
}

export async function importScenesFromCsv(audioProjectId: string, csvText: string): Promise<ActionResult<ImportScenesResult>> {
  let data: ImportScenesResult;
  try {
    data = await backendFetch<ImportScenesResult>(`/audio/projects/${audioProjectId}/scenes/import`, {
      method: "POST",
      body: JSON.stringify({ csvText }),
    });
  } catch (err) {
    return translateError(err, "Failed to import CSV.");
  }

  revalidatePath(`/audio/${audioProjectId}`);
  return { ok: true, data };
}

// ─────────────────────────────────────────────────────────────────────────
// Generation (credits-consuming — apps/backend queues it via enqueueJob)
// ─────────────────────────────────────────────────────────────────────────

export async function generateSceneAudio(sceneId: string): Promise<ActionResult> {
  let result: { audioProjectId: string };
  try {
    result = await backendFetch<{ ok: true; audioProjectId: string }>(`/audio/scenes/${sceneId}/generate`, {
      method: "POST",
    });
  } catch (err) {
    return translateError(err, "Failed to queue generation.");
  }

  revalidatePath(`/audio/${result.audioProjectId}`);
  return { ok: true };
}

export async function generateAllPendingScenes(audioProjectId: string): Promise<ActionResult<{ queued: number; failures: string[] }>> {
  let data: { queued: number; failures: string[] };
  try {
    data = await backendFetch<{ queued: number; failures: string[] }>(`/audio/projects/${audioProjectId}/generate-all`, {
      method: "POST",
    });
  } catch (err) {
    return translateError(err, "Failed to queue generation.");
  }

  revalidatePath(`/audio/${audioProjectId}`);
  return { ok: true, data };
}

// ─────────────────────────────────────────────────────────────────────────
// Merge / export
// ─────────────────────────────────────────────────────────────────────────

export async function requestExport(
  audioProjectId: string,
  sceneIds: string[],
  type: "CHUNK" | "MERGED",
): Promise<ActionResult> {
  try {
    await backendFetch(`/audio/projects/${audioProjectId}/export`, {
      method: "POST",
      body: JSON.stringify({ sceneIds, type }),
    });
  } catch (err) {
    return translateError(err, "Failed to queue export.");
  }

  revalidatePath(`/audio/${audioProjectId}`);
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────
// Playback / download URLs (short-lived presigned reads)
// ─────────────────────────────────────────────────────────────────────────

export async function getSignedAudioUrl(storageKey: string): Promise<string> {
  const { url } = await backendFetch<{ url: string }>(`/audio/signed-url?key=${encodeURIComponent(storageKey)}`);
  return url;
}

// ─────────────────────────────────────────────────────────────────────────
// `useFormState`-shaped wrappers — unchanged from before this chunk.
// ─────────────────────────────────────────────────────────────────────────

export async function addSceneFormAction(
  audioProjectId: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return addScene(audioProjectId, formData);
}

export async function importScenesFromCsvFormAction(
  audioProjectId: string,
  _prevState: ActionResult<ImportScenesResult> | null,
  formData: FormData,
): Promise<ActionResult<ImportScenesResult>> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Please choose a CSV file to import." };
  }
  const csvText = await file.text();
  return importScenesFromCsv(audioProjectId, csvText);
}

export async function generateSceneAudioFormAction(
  sceneId: string,
  _prevState: ActionResult | null,
  _formData: FormData,
): Promise<ActionResult> {
  return generateSceneAudio(sceneId);
}

export async function generateAllPendingScenesFormAction(
  audioProjectId: string,
  _prevState: ActionResult<{ queued: number; failures: string[] }> | null,
  _formData: FormData,
): Promise<ActionResult<{ queued: number; failures: string[] }>> {
  return generateAllPendingScenes(audioProjectId);
}

export async function requestExportFormAction(
  audioProjectId: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const sceneIds = formData.getAll("sceneIds").map(String);
  const type: "CHUNK" | "MERGED" = formData.get("type") === "MERGED" ? "MERGED" : "CHUNK";
  return requestExport(audioProjectId, sceneIds, type);
}
