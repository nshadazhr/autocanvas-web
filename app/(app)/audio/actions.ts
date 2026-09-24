"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as dummy from "../../../lib/dummy-data";

// ─────────────────────────────────────────────────────────────────────────
// DUMMY MODE — Audio Studio's Server Actions previously called apps/backend
// over HTTP via `lib/backend-client.ts` (see the git history on this file).
// There is no apps/backend in this standalone build, so every function
// below now reads/writes the in-memory store in `lib/dummy-data.ts`
// directly instead. Every exported name and signature is UNCHANGED —
// action-forms.tsx and both audio pages needed zero changes.
// ─────────────────────────────────────────────────────────────────────────

export interface ActionResult<T = void> {
  ok: boolean;
  message?: string;
  data?: T;
}

function translateError(err: unknown, fallback: string): ActionResult<never> {
  return { ok: false, message: err instanceof Error ? err.message : fallback };
}

export type SceneStatus = "PENDING" | "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

interface ProjectSummaryRow {
  id: string;
  name: string;
  status: string;
  audioProject: { id: string; _count: { scenes: number } } | null;
}

export interface AudioSceneDetailRow {
  id: string;
  orderIndex: number;
  status: SceneStatus;
  sceneNumber: number;
  title: string | null;
  text: string;
  speaker: string;
  style: string;
  emotion: string;
  voice: string;
  gender: "Male" | "Female";
  speed: number;
  pitch: number;
  words: number;
  characters: number;
  credits: number;
  generations: Array<{ storageKey: string | null }>;
}

export interface AudioExportRow {
  id: string;
  type: string;
  sceneIds: string[];
  storageKey: string;
  createdAt: string;
}

export interface AudioProjectDetail {
  id: string;
  defaultFormat: string;
  defaultVoice?: string;
  language?: string;
  lastSavedAt: string;
  project: { id: string; name: string; ownerId: string };
  scenes: AudioSceneDetailRow[];
  exports: AudioExportRow[];
  speakers: Record<string, { voice: string; gender: "Male" | "Female" }>;
}

// NOTE: the VOICE_CATALOG/STYLE_OPTIONS/EMOTION_OPTIONS dropdown catalogs
// used to be re-exported from here, but a "use server" file can only export
// async functions — see ./catalogs.ts for the actual (non-"use server")
// re-export client components should import instead.
export type { SceneFieldUpdate } from "../../../lib/dummy-data";

// ─────────────────────────────────────────────────────────────────────────
// Projects
// ─────────────────────────────────────────────────────────────────────────

export async function listAudioProjects(): Promise<ProjectSummaryRow[]> {
  return dummy.listAudioProjects();
}

/**
 * Signature matches `useFormState`'s `(prevState, formData) => nextState` —
 * same reasoning as before this chunk (see the git history on this file).
 *
 * Backs the "Create New Audio Project" modal. `name` is the only required
 * field. `method` picks how the initial scenes are populated:
 *  - "paste": `storyText` is split into scenes on blank lines (a simple,
 *    honest paragraph split — there's no real AI splitter in dummy mode).
 *  - "csv": `csvFile` is imported the same way the CSV import form on the
 *    project detail page does it.
 * `voice`/`language` have no real voice catalog or TTS engine behind them
 * yet — they're saved as project preferences and shown back on the detail
 * page, but don't affect generation.
 */
export async function createAudioProject(
  _prevState: ActionResult<{ audioProjectId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ audioProjectId: string }>> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { ok: false, message: "Project name is required." };
  }

  const method = String(formData.get("method") ?? "paste");
  const voice = String(formData.get("voice") ?? "").trim() || undefined;
  const language = String(formData.get("language") ?? "").trim() || undefined;

  let audioProjectId: string;
  try {
    audioProjectId = dummy.createAudioProject(name, { defaultVoice: voice, language });

    if (method === "csv") {
      const file = formData.get("csvFile");
      if (file instanceof File && file.size > 0) {
        const csvText = await file.text();
        dummy.importScenesFromCsv(audioProjectId, csvText);
      }
    } else {
      const storyText = String(formData.get("storyText") ?? "").trim();
      if (storyText) {
        const paragraphs = storyText
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean);
        const chunks = paragraphs.length > 0 ? paragraphs : [storyText];
        for (const chunk of chunks) {
          dummy.addScene(audioProjectId, chunk);
        }
      }
    }
  } catch (err) {
    return translateError(err, "Failed to create project.");
  }

  revalidatePath("/audio");
  redirect(`/audio/${audioProjectId}`);
}

export async function getAudioProjectDetail(audioProjectId: string): Promise<AudioProjectDetail> {
  return dummy.getAudioProjectDetail(audioProjectId);
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
    dummy.addScene(audioProjectId, text, title);
  } catch (err) {
    return translateError(err, "Failed to add scene.");
  }

  revalidatePath(`/audio/${audioProjectId}`);
  return { ok: true };
}

export async function deleteScene(audioProjectId: string, sceneId: string): Promise<ActionResult> {
  try {
    dummy.deleteScene(audioProjectId, sceneId);
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
    data = dummy.importScenesFromCsv(audioProjectId, csvText);
  } catch (err) {
    return translateError(err, "Failed to import CSV.");
  }

  revalidatePath(`/audio/${audioProjectId}`);
  return { ok: true, data };
}

// ─────────────────────────────────────────────────────────────────────────
// Generation (dummy mode: completes instantly, no real TTS/queue/worker)
// ─────────────────────────────────────────────────────────────────────────

export async function generateSceneAudio(sceneId: string): Promise<ActionResult> {
  let result: { audioProjectId: string };
  try {
    result = dummy.generateSceneAudio(sceneId);
  } catch (err) {
    return translateError(err, "Failed to queue generation.");
  }

  revalidatePath(`/audio/${result.audioProjectId}`);
  return { ok: true };
}

export async function generateAllPendingScenes(audioProjectId: string): Promise<ActionResult<{ queued: number; failures: string[] }>> {
  let data: { queued: number; failures: string[] };
  try {
    data = dummy.generateAllPendingScenes(audioProjectId);
  } catch (err) {
    return translateError(err, "Failed to queue generation.");
  }

  revalidatePath(`/audio/${audioProjectId}`);
  return { ok: true, data };
}

// ─────────────────────────────────────────────────────────────────────────
// Scenes table bulk actions — Save Changes / Apply Voice to Speaker /
// Reset Selected to Pending (see the rich Scenes table in the reference
// design). All three revalidate the project detail page the same way the
// existing single-scene actions above do.
// ─────────────────────────────────────────────────────────────────────────

export async function updateScenes(
  audioProjectId: string,
  updates: dummy.SceneFieldUpdate[],
): Promise<ActionResult> {
  try {
    dummy.bulkUpdateScenes(audioProjectId, updates);
  } catch (err) {
    return translateError(err, "Failed to save changes.");
  }

  revalidatePath(`/audio/${audioProjectId}`);
  return { ok: true };
}

export async function applyVoiceToSpeaker(
  audioProjectId: string,
  speaker: string,
  voice: string,
  gender: "Male" | "Female",
): Promise<ActionResult<{ affected: number }>> {
  let affected: number;
  try {
    affected = dummy.applyVoiceToSpeaker(audioProjectId, speaker, voice, gender);
  } catch (err) {
    return translateError(err, "Failed to apply voice.");
  }

  revalidatePath(`/audio/${audioProjectId}`);
  return { ok: true, data: { affected } };
}

export async function resetScenesToPending(
  audioProjectId: string,
  sceneIds: string[],
): Promise<ActionResult<{ affected: number }>> {
  let affected: number;
  try {
    affected = dummy.resetScenesToPending(audioProjectId, sceneIds);
  } catch (err) {
    return translateError(err, "Failed to reset scenes.");
  }

  revalidatePath(`/audio/${audioProjectId}`);
  return { ok: true, data: { affected } };
}

export async function checkCredits(
  characters: number,
): Promise<{ creditsRequired: number; availableCredits: number }> {
  const account = dummy.getCreditAccount();
  return { creditsRequired: dummy.creditsForCharacters(characters), availableCredits: account.balance };
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
    dummy.requestExport(audioProjectId, sceneIds, type);
  } catch (err) {
    return translateError(err, "Failed to queue export.");
  }

  revalidatePath(`/audio/${audioProjectId}`);
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────
// Playback / download URLs (dummy mode: always the same placeholder file)
// ─────────────────────────────────────────────────────────────────────────

export async function getSignedAudioUrl(storageKey: string): Promise<string> {
  return dummy.getSignedAudioUrl(storageKey);
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
