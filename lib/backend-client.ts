import { auth } from "@platform/auth";
import { signBridgeToken, type PlatformRole } from "@platform/auth/bridge-token";
import { VOICE_CATALOG, creditsForCharacters, type SceneFieldUpdate } from "./dummy-data";

// ─────────────────────────────────────────────────────────────────────────
// The real counterpart to DUMMY MODE for Audio Studio only. Every function
// below calls the NestJS backend (apps/backend / autocanvas-api) over HTTP
// instead of reading/writing lib/dummy-data.ts's in-memory store — see that
// file's top comment for why the rest of the app (billing, dashboard, etc.)
// is untouched and still dummy-mode.
//
// app/(app)/audio/actions.ts is the only caller of this file. Every
// exported function here returns the SAME shape actions.ts already expects
// from lib/dummy-data.ts, so action-forms.tsx / project-workspace.tsx need
// zero changes — the mapping from the backend's real Prisma-shaped
// responses (character vs. speaker, VoiceProfile relations vs. flat
// gender/speed/pitch columns, etc.) happens entirely inside this file.
// ─────────────────────────────────────────────────────────────────────────

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

export interface ImportScenesResult {
  imported: number;
  rowErrors: string[];
}

// ─────────────────────────────────────────────────────────────────────────
// HTTP plumbing
// ─────────────────────────────────────────────────────────────────────────

async function mintBridgeToken(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not signed in.");
  }
  return signBridgeToken({
    sub: session.user.id,
    role: (session.user.role as PlatformRole | undefined) ?? "USER",
    email: session.user.email,
  });
}

/** NestJS's default exception filter returns `{ statusCode, message, error }`,
 * where `message` is a plain string for thrown HttpExceptions but an array
 * of strings for class-validator's ValidationPipe failures — both are
 * flattened into one readable string here so every caller can just show
 * `err.message`. */
function extractErrorMessage(body: unknown, status: number): string {
  const message = (body as { message?: string | string[] } | undefined)?.message;
  if (Array.isArray(message)) return message.join("; ");
  if (typeof message === "string" && message) return message;
  return `Backend request failed (${status}).`;
}

async function backendFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    throw new Error("BACKEND_URL is not set — Audio Studio can't reach the backend service.");
  }
  const token = await mintBridgeToken();

  const res = await fetch(`${backendUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
    cache: "no-store",
  });

  const raw = await res.text();
  const body = raw ? JSON.parse(raw) : undefined;

  if (!res.ok) {
    throw new Error(extractErrorMessage(body, res.status));
  }
  return body as T;
}

// ─────────────────────────────────────────────────────────────────────────
// Response mapping — real schema -> the shapes actions.ts already expects
// ─────────────────────────────────────────────────────────────────────────

interface RawVoiceProfile {
  id: string;
  name: string;
  gender: string | null;
  speed: number | string;
  pitch: number | string;
}

interface RawAudioScene {
  id: string;
  orderIndex: number;
  status: SceneStatus;
  sceneNumber: number;
  title: string | null;
  text: string;
  character: string | null;
  style: string | null;
  emotion: string | null;
  voiceProfileId: string | null;
  voiceProfile: RawVoiceProfile | null;
  generations: Array<{ storageKey: string | null }>;
}

interface RawAudioExport {
  id: string;
  type: string;
  sceneIds: string[];
  storageKey: string;
  createdAt: string;
}

interface RawAudioProjectDetail {
  id: string;
  language: string;
  defaultFormat: string;
  defaultVoiceId: string | null;
  defaultVoice: RawVoiceProfile | null;
  updatedAt: string;
  project: { id: string; name: string; ownerId: string };
  scenes: RawAudioScene[];
  exports: RawAudioExport[];
}

// Same fallback a brand-new dummy-mode scene gets (see dummy-data.ts's
// `defaultSceneFields`) — used whenever a scene has no voiceProfile of its
// own AND the project has no default voice either.
const FALLBACK_VOICE = {
  voice: VOICE_CATALOG[0].value,
  gender: VOICE_CATALOG[0].gender,
  speed: 1,
  pitch: 1,
} as const;

function normalizeGender(raw: string | null | undefined): "Male" | "Female" {
  const lower = raw?.toLowerCase();
  if (lower === "female") return "Female";
  if (lower === "male") return "Male";
  return FALLBACK_VOICE.gender;
}

function resolveVoiceDisplay(profile: RawVoiceProfile | null | undefined) {
  if (!profile) return FALLBACK_VOICE;
  return {
    voice: profile.name,
    gender: normalizeGender(profile.gender),
    speed: Number(profile.speed),
    pitch: Number(profile.pitch),
  };
}

/** Mirrors dummy-data.ts's own (unexported) `wordCount` helper exactly, so
 * the Scenes table's Words column reads identically in both modes. */
function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

function mapScene(scene: RawAudioScene, projectDefaultVoice: RawVoiceProfile | null): AudioSceneDetailRow {
  const display = resolveVoiceDisplay(scene.voiceProfile ?? projectDefaultVoice);
  return {
    id: scene.id,
    orderIndex: scene.orderIndex,
    status: scene.status,
    sceneNumber: scene.sceneNumber,
    title: scene.title,
    text: scene.text,
    speaker: scene.character?.trim() || "Narrator",
    style: scene.style || "Narrative",
    emotion: scene.emotion || "Calm",
    voice: display.voice,
    gender: display.gender,
    speed: display.speed,
    pitch: display.pitch,
    words: wordCount(scene.text),
    characters: scene.text.length,
    credits: creditsForCharacters(scene.text.length),
    generations: scene.generations.length ? [{ storageKey: scene.generations[0].storageKey }] : [],
  };
}

function mapProjectDetail(raw: RawAudioProjectDetail): AudioProjectDetail {
  const scenes = raw.scenes
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((scene) => mapScene(scene, raw.defaultVoice));

  // Derived, not stored — the real schema has no per-project "speakers"
  // table like dummy mode's `DummyAudioProject.speakers`. Built here from
  // whichever voice each speaker's scenes actually resolved to, purely so
  // "Apply Voice to Speaker" and new-scene defaults have something to
  // prefill in the UI.
  const speakers: Record<string, { voice: string; gender: "Male" | "Female" }> = {};
  for (const scene of scenes) {
    if (!speakers[scene.speaker]) {
      speakers[scene.speaker] = { voice: scene.voice, gender: scene.gender };
    }
  }

  return {
    id: raw.id,
    defaultFormat: raw.defaultFormat,
    defaultVoice: raw.defaultVoice?.name,
    language: raw.language,
    lastSavedAt: raw.updatedAt,
    project: raw.project,
    scenes,
    exports: raw.exports.map((e) => ({
      id: e.id,
      type: e.type,
      sceneIds: e.sceneIds,
      storageKey: e.storageKey,
      createdAt: e.createdAt,
    })),
    speakers,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Projects
// ─────────────────────────────────────────────────────────────────────────

export async function listAudioProjects(): Promise<ProjectSummaryRow[]> {
  return backendFetch<ProjectSummaryRow[]>("/audio/projects");
}

export async function createAudioProject(
  name: string,
  opts?: { voice?: string; language?: string },
): Promise<{ audioProjectId: string }> {
  return backendFetch<{ audioProjectId: string }>("/audio/projects", {
    method: "POST",
    body: JSON.stringify({ name, voice: opts?.voice, language: opts?.language }),
  });
}

export async function getAudioProjectDetail(audioProjectId: string): Promise<AudioProjectDetail> {
  const raw = await backendFetch<RawAudioProjectDetail>(`/audio/projects/${audioProjectId}`);
  return mapProjectDetail(raw);
}

// ─────────────────────────────────────────────────────────────────────────
// Scenes: manual add + CSV import
// ─────────────────────────────────────────────────────────────────────────

export async function addScene(audioProjectId: string, text: string, title?: string): Promise<void> {
  await backendFetch(`/audio/projects/${audioProjectId}/scenes`, {
    method: "POST",
    body: JSON.stringify({ text, title }),
  });
}

export async function deleteScene(audioProjectId: string, sceneId: string): Promise<void> {
  await backendFetch(`/audio/projects/${audioProjectId}/scenes/${sceneId}`, { method: "DELETE" });
}

export async function importScenesFromCsv(audioProjectId: string, csvText: string): Promise<ImportScenesResult> {
  return backendFetch<ImportScenesResult>(`/audio/projects/${audioProjectId}/scenes/import`, {
    method: "POST",
    body: JSON.stringify({ csvText }),
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Generation (real mode: queued via BullMQ, processed by apps/worker — see
// the delivery notes on what's NOT included in this pilot zip)
// ─────────────────────────────────────────────────────────────────────────

export async function generateSceneAudio(sceneId: string): Promise<{ audioProjectId: string }> {
  return backendFetch<{ ok: true; audioProjectId: string }>(`/audio/scenes/${sceneId}/generate`, {
    method: "POST",
  });
}

export async function generateAllPendingScenes(
  audioProjectId: string,
): Promise<{ queued: number; failures: string[] }> {
  return backendFetch(`/audio/projects/${audioProjectId}/generate-all`, { method: "POST" });
}

// ─────────────────────────────────────────────────────────────────────────
// Scenes table bulk actions
// ─────────────────────────────────────────────────────────────────────────

export async function bulkUpdateScenes(audioProjectId: string, updates: SceneFieldUpdate[]): Promise<void> {
  await backendFetch(`/audio/projects/${audioProjectId}/scenes`, {
    method: "PATCH",
    body: JSON.stringify({ updates }),
  });
}

export async function applyVoiceToSpeaker(
  audioProjectId: string,
  speaker: string,
  voice: string,
  gender: "Male" | "Female",
): Promise<{ affected: number }> {
  return backendFetch(`/audio/projects/${audioProjectId}/apply-voice`, {
    method: "POST",
    body: JSON.stringify({ speaker, voice, gender }),
  });
}

export async function resetScenesToPending(
  audioProjectId: string,
  sceneIds: string[],
): Promise<{ affected: number }> {
  return backendFetch(`/audio/projects/${audioProjectId}/scenes/reset`, {
    method: "POST",
    body: JSON.stringify({ sceneIds }),
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Merge / export
// ─────────────────────────────────────────────────────────────────────────

export async function requestExport(
  audioProjectId: string,
  sceneIds: string[],
  type: "CHUNK" | "MERGED",
): Promise<void> {
  await backendFetch(`/audio/projects/${audioProjectId}/export`, {
    method: "POST",
    body: JSON.stringify({ sceneIds, type }),
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Playback / download URLs (real mode: a real signed S3/MinIO URL)
// ─────────────────────────────────────────────────────────────────────────

export async function getSignedAudioUrl(storageKey: string): Promise<string> {
  const result = await backendFetch<{ url: string }>(`/audio/signed-url?key=${encodeURIComponent(storageKey)}`);
  return result.url;
}
