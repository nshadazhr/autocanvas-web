"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as backend from "../../../lib/backend-client";
import * as dummy from "../../../lib/dummy-data";

// ─────────────────────────────────────────────────────────────────────────
// REAL BACKEND MODE — Audio Studio's Server Actions call the NestJS backend
// (apps/backend / autocanvas-api) over HTTP via lib/backend-client.ts,
// which mints a short-lived bridge token (packages/auth/src/bridge-token.ts)
// from the signed-in session and maps the backend's real Prisma-shaped
// responses back into the exact shapes this file already returned in
// dummy mode. Every exported name and signature below is UNCHANGED from
// the dummy-mode version — action-forms.tsx and both audio pages need zero
// changes.
//
// `checkCredits` is the one exception: it still reads
// `dummy.getCreditAccount()` on purpose — billing/credits are out of scope
// for this backend pilot (see apps/backend's main.ts), so that one action
// stays on the same in-memory store the rest of the app (billing,
// dashboard) still uses.
// ─────────────────────────────────────────────────────────────────────────

export interface ActionResult<T = void> {
  ok: boolean;
  message?: string;
  data?: T;
}

function translateError(err: unknown, fallback: string): ActionResult<never> {
  return { ok: false, message: err instanceof Error ? err.message : fallback };
}

export type { SceneStatus, AudioSceneDetailRow, AudioExportRow, AudioProjectDetail } from "../../../lib/backend-client";

// NOTE: the VOICE_CATALOG/STYLE_OPTIONS/EMOTION_OPTIONS dropdown catalogs
// used to be re-exported from here, but a "use server" file can only export
// async functions — see ./catalogs.ts for the actual (non-"use server")
// re-export client components should import instead. Those catalogs are
// still the dummy-mode VOICE_CATALOG on purpose — see
// lib/backend-client.ts's header comment on why project-workspace.tsx's
// voice picker stays unchanged, and packages/database/prisma/seed.ts for
// the matching real VoiceProfile rows those names now resolve to.
export type { SceneFieldUpdate } from "../../../lib/dummy-data";

// ─────────────────────────────────────────────────────────────────────────
// Projects
// ─────────────────────────────────────────────────────────────────────────

export async function listAudioProjects() {
  return backend.listAudioProjects();
}

/**
 * Signature matches `useFormState`'s `(prevState, formData) => nextState` —
 * same reasoning as before this chunk (see the git history on this file).
 *
 * Backs the "Create New Audio Project" modal. `name` is the only required
 * field. `method` picks how the initial scenes are populated:
 *  - "paste": `storyText` is split into scenes on blank lines (a simple,
 *    honest paragraph split — there's no AI splitter on the backend yet).
 *  - "csv": `csvFile` is imported the same way the CSV import form on the
 *    project detail page does it.
 * `voice`/`language` are passed straight through to the backend's
 * createAudioProject, which resolves `voice` (a VoiceProfile name) to the
 * project's `defaultVoiceId` and saves `language` on the AudioProject row.
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
    const result = await backend.createAudioProject(name, { voice, language });
    audioProjectId = result.audioProjectId;

    if (method === "csv") {
      const file = formData.get("csvFile");
      if (file instanceof File && file.size > 0) {
        const csvText = await file.text();
        await backend.importScenesFromCsv(audioProjectId, csvText);
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
          await backend.addScene(audioProjectId, chunk);
        }
      }
    }
  } catch (err) {
    return translateError(err, "Failed to create project.");
  }

  revalidatePath("/audio");
  redirect(`/audio/${audioProjectId}`);
}

export async function getAudioProjectDetail(audioProjectId: string) {
  return backend.getAudioProjectDetail(audioProjectId);
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
    await backend.addScene(audioProjectId, text, title);
  } catch (err) {
    return translateError(err, "Failed to add scene.");
  }

  revalidatePath(`/audio/${audioProjectId}`);
  return { ok: true };
}

export async function deleteScene(audioProjectId: string, sceneId: string): Promise<ActionResult> {
  try {
    await backend.deleteScene(audioProjectId, sceneId);
  } catch (err) {
    return translateError(err, "Failed to delete scene.");
  }

  revalidatePath(`/audio/${audioProjectId}`);
  return { ok: true };
}

export type { ImportScenesResult } from "../../../lib/backend-client";

export async function importScenesFromCsv(
  audioProjectId: string,
  csvText: string,
): Promise<ActionResult<backend.ImportScenesResult>> {
  let data: backend.ImportScenesResult;
  try {
    data = await backend.importScenesFromCsv(audioProjectId, csvText);
  } catch (err) {
    return translateError(err, "Failed to import CSV.");
  }

  revalidatePath(`/audio/${audioProjectId}`);
  return { ok: true, data };
}

// ─────────────────────────────────────────────────────────────────────────
// Generation — queued for real via BullMQ + apps/worker (see the delivery
// notes on apps/worker not being included in this pilot zip; scenes will
// sit at QUEUED until a worker process picks the job up).
// ─────────────────────────────────────────────────────────────────────────

export async function generateSceneAudio(sceneId: string): Promise<ActionResult> {
  let result: { audioProjectId: string };
  try {
    result = await backend.generateSceneAudio(sceneId);
  } catch (err) {
    return translateError(err, "Failed to queue generation.");
  }

  revalidatePath(`/audio/${result.audioProjectId}`);
  return { ok: true };
}

export async function generateAllPendingScenes(
  audioProjectId: string,
): Promise<ActionResult<{ queued: number; failures: string[] }>> {
  let data: { queued: number; failures: string[] };
  try {
    data = await backend.generateAllPendingScenes(audioProjectId);
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
    await backend.bulkUpdateScenes(audioProjectId, updates);
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
    const result = await backend.applyVoiceToSpeaker(audioProjectId, speaker, voice, gender);
    affected = result.affected;
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
    const result = await backend.resetScenesToPending(audioProjectId, sceneIds);
    affected = result.affected;
  } catch (err) {
    return translateError(err, "Failed to reset scenes.");
  }

  revalidatePath(`/audio/${audioProjectId}`);
  return { ok: true, data: { affected } };
}

// checkCredits deliberately stays on dummy mode — see this file's top
// comment. Billing/credits aren't part of this backend pilot's scope.
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
    await backend.requestExport(audioProjectId, sceneIds, type);
  } catch (err) {
    return translateError(err, "Failed to queue export.");
  }

  revalidatePath(`/audio/${audioProjectId}`);
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────
// Playback / download URLs — real, signed S3/MinIO URLs once storage is
// configured on the backend (see .env.example's STORAGE_* vars there).
// ─────────────────────────────────────────────────────────────────────────

export async function getSignedAudioUrl(storageKey: string): Promise<string> {
  return backend.getSignedAudioUrl(storageKey);
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
  _prevState: ActionResult<backend.ImportScenesResult> | null,
  formData: FormData,
): Promise<ActionResult<backend.ImportScenesResult>> {
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
