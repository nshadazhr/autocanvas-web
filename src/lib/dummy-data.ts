// ─────────────────────────────────────────────────────────────────────────
// DUMMY MODE — the entire in-memory "backend" for this standalone preview
// build of autocanvas-web.
//
// This file replaces every real integration the app previously depended on
// (Postgres via @platform/database, real Stripe/Razorpay via
// @platform/billing, and apps/backend over HTTP via lib/backend-client.ts)
// with plain in-memory state. There is exactly ONE fixed demo account
// (DUMMY_USER) and any email/password typed on the login page signs into
// it — see packages/auth/src/config.ts.
//
// This is intentionally a single module-level singleton (plain variables,
// not a class/DB) so all of Next.js's Server Actions/Server Components —
// which each run as separate function calls against the same running
// Node process — see the same data. That also means:
//   - Data lives ONLY for the life of the `next dev`/`next start` process.
//     Restarting the server resets everything back to the seed data below.
//   - This is fine (in fact the point) for previewing/demoing the UI
//     without provisioning Postgres or running a second backend process,
//     but it is NOT a real persistence layer — nothing here should be
//     mistaken for production data storage.
// ─────────────────────────────────────────────────────────────────────────

export type PlatformRole = "USER" | "ADMIN" | "SUPER_ADMIN";

export interface DummyUser {
  id: string;
  email: string;
  name: string;
  role: PlatformRole;
}

/** The one account dummy mode ever signs anyone into — see config.ts's authorize(). */
export const DUMMY_USER: DummyUser = {
  id: "dummy-user-1",
  email: "demo@autocanvas.app",
  name: "Demo Creator",
  role: "USER",
};

// ─────────────────────────────────────────────────────────────────────────
// Global singleton store.
//
// Next.js's dev server compiles each route segment (and the Server Actions
// bound to it) as its own on-demand webpack entry. That means a *plain*
// module-level `let`/`const` in this file can end up instantiated more than
// once in dev mode — e.g. once for the "/audio" page (whose form submits
// createAudioProject) and again for "/audio/[audioProjectId]" (the page the
// action redirects to) — each with its own empty `Map`, even though it's
// "the same" imported module by file path. That mismatch is exactly what
// produced the "Audio project not found" crash right after creating a
// project: the id was written into one instance of `audioProjects` and read
// back from a different, fresh one.
//
// Stashing the actual mutable state on `globalThis` (keyed so it survives
// Fast Refresh too) sidesteps this: every module instantiation reads/writes
// the same object, so it behaves like the intended single in-memory
// "backend" regardless of how many separate module graphs dev mode compiles
// it into. This mirrors the standard Next.js pattern for e.g. a singleton
// Prisma client in dev mode.
// ─────────────────────────────────────────────────────────────────────────

interface DummyGlobalState {
  nextId: number;
  creditState: { balance: number; reserved: number };
  currentPlanKey: string | null;
  audioProjects: Map<string, DummyAudioProject>;
  seeded: boolean;
}

const globalForDummyData = globalThis as unknown as { __autocanvasDummyState?: DummyGlobalState };

const dummyState: DummyGlobalState =
  globalForDummyData.__autocanvasDummyState ??
  (globalForDummyData.__autocanvasDummyState = {
    nextId: 1,
    creditState: { balance: 2450, reserved: 0 },
    currentPlanKey: "creator",
    audioProjects: new Map<string, DummyAudioProject>(),
    seeded: false,
  });

function makeId(prefix: string): string {
  return `${prefix}-${dummyState.nextId++}`;
}

// ─────────────────────────────────────────────────────────────────────────
// Credits
// ─────────────────────────────────────────────────────────────────────────

export function getCreditAccount(): { balance: number; reserved: number } {
  return { ...dummyState.creditState };
}

function addCredits(amount: number): void {
  dummyState.creditState.balance += amount;
}

// ─────────────────────────────────────────────────────────────────────────
// Billing / plans (stand-ins for the real Stripe/Razorpay-backed rows)
// ─────────────────────────────────────────────────────────────────────────

export interface DummyPlan {
  key: string;
  name: string;
  monthlyCredits: number;
  priceCents: number;
  currency: string;
  stripePriceId: string | null;
  razorpayPlanId: string | null;
}

export const DUMMY_PLANS: DummyPlan[] = [
  {
    key: "creator",
    name: "Creator",
    monthlyCredits: 2500,
    priceCents: 1900,
    currency: "usd",
    stripePriceId: "price_dummy_creator",
    razorpayPlanId: "plan_dummy_creator",
  },
  {
    key: "pro",
    name: "Pro",
    monthlyCredits: 8000,
    priceCents: 4900,
    currency: "usd",
    stripePriceId: "price_dummy_pro",
    razorpayPlanId: "plan_dummy_pro",
  },
  {
    key: "business",
    name: "Business",
    monthlyCredits: 25000,
    priceCents: 14900,
    currency: "usd",
    stripePriceId: "price_dummy_business",
    razorpayPlanId: null,
  },
];

export function listPlans(): DummyPlan[] {
  return DUMMY_PLANS;
}

export function getCurrentPlanKey(): string | null {
  return dummyState.currentPlanKey;
}

/**
 * Dummy mode has no real payment provider to redirect to, so "checkout" is
 * simulated as an instant success: the plan switches and that plan's
 * monthly credit allotment is granted right away.
 */
export function applyDummyCheckout(planKey: string): boolean {
  const plan = DUMMY_PLANS.find((p) => p.key === planKey);
  if (!plan) return false;
  dummyState.currentPlanKey = planKey;
  addCredits(plan.monthlyCredits);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────
// Audio Studio
// ─────────────────────────────────────────────────────────────────────────

export type SceneStatus = "PENDING" | "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

/** The voices dummy mode pretends the Gemini TTS API "supports" — matches
 * the reference design's Voice column exactly. No real TTS engine is wired
 * up yet (see the Python ai-voice-generator discussion), so picking a voice
 * here has no audible effect — it's saved and shown back, that's all. */
export interface VoiceOption {
  value: string;
  label: string;
  gender: "Male" | "Female";
}

export const VOICE_CATALOG: VoiceOption[] = [
  { value: "Zephyr - Bright", label: "Zephyr - Bright", gender: "Female" },
  { value: "Achird - Friendly", label: "Achird - Friendly", gender: "Male" },
  { value: "Sadaltager - Knc", label: "Sadaltager - Knc", gender: "Male" },
  { value: "Orus - Firm", label: "Orus - Firm", gender: "Male" },
  { value: "Algenib - Gravell", label: "Algenib - Gravell", gender: "Male" },
  { value: "Aoede - Warm", label: "Aoede - Warm", gender: "Female" },
  { value: "Callirrhoe - Energetic", label: "Callirrhoe - Energetic", gender: "Female" },
];

export const STYLE_OPTIONS = ["Narrative", "Conversational", "Direct", "Firm", "Dramatic"] as const;
export const EMOTION_OPTIONS = ["Calm", "Serious", "Worried", "Happy", "Shocked", "Dramatic"] as const;

/** Illustrative dummy pricing: ~45 characters per credit, minimum 1 credit
 * per scene so an empty/near-empty scene still "costs" something in the
 * preview UI. There is no real billing engine behind this number yet — see
 * lib's top-of-file note — it exists purely so the Scenes table's "Credits
 * Required" / "Check Credits" UI has something consistent to show. */
export function creditsForCharacters(characters: number): number {
  return Math.max(1, Math.ceil(characters / 45));
}

interface DummyScene {
  id: string;
  orderIndex: number;
  sceneNumber: number;
  title: string | null;
  text: string;
  status: SceneStatus;
  storageKey: string | null;
  speaker: string;
  style: string;
  emotion: string;
  voice: string;
  gender: "Male" | "Female";
  speed: number;
  pitch: number;
}

interface DummyExport {
  id: string;
  type: "CHUNK" | "MERGED";
  sceneIds: string[];
  storageKey: string;
  createdAt: string;
}

interface DummyAudioProject {
  /** Stands in for the generic `Project.id`. */
  projectId: string;
  /** Stands in for `AudioProject.id` — the id every URL/action uses. */
  audioProjectId: string;
  name: string;
  status: string;
  defaultFormat: string;
  scenes: DummyScene[];
  exports: DummyExport[];
  /** Chosen at creation time in the "Create New Audio Project" modal. Saved
   * as project preferences and shown back on the detail page — dummy mode
   * has no real voice catalog/TTS engine yet, so these don't affect
   * generation, but they aren't thrown away either. */
  defaultVoice?: string;
  language?: string;
  /** Per-character voice assignments — "Edit Speakers" / "Apply Voice to
   * Speaker" write here. Keyed by the speaker name exactly as it appears on
   * scenes. */
  speakers: Record<string, { voice: string; gender: "Male" | "Female" }>;
  /** Updated on every scene mutation so the "Saved X ago" indicator in the
   * reference design has something real (if approximate) to show. */
  lastSavedAt: string;
}

/** A tiny (0.05s) silent WAV, used as the "generated"/"exported" file for
 * every dummy scene and export so playback/download links resolve to a
 * real, playable file instead of a dead link — there is no real object
 * storage or TTS provider behind this. */
export const DUMMY_AUDIO_DATA_URL =
  "data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YSADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

const NARRATOR_NAMES = new Set(["narrator", "narration", "voice over", "voiceover", "vo", "story", "author"]);

function isNarratorSpeaker(speaker: string): boolean {
  return NARRATOR_NAMES.has(speaker.trim().toLowerCase());
}

/** Deterministic per-name index — the same polynomial rolling hash the
 * Python reference's `SpeakerDetector._stable_index` uses (NOT `hash()`,
 * which Python salts per-process, and NOT `Math.random()`), so the same
 * speaker name always lands on the same fallback voice across imports,
 * while different speakers land on different indices. */
function stableIndex(name: string, modulo: number): number {
  let total = 0;
  for (let i = 0; i < name.length; i++) {
    total = (total * 31 + name.charCodeAt(i)) >>> 0;
  }
  return modulo > 0 ? total % modulo : 0;
}

/** Picks a voice for a speaker who doesn't already have one registered on
 * this project — mirrors the Python reference's `SpeakerDetector._pick`:
 * the narrator always gets the catalog's first voice, and every other new
 * speaker gets a *stable* (same name -> same voice every time) but
 * *distinct* voice, pulled preferentially from whichever catalog entries
 * aren't already assigned to another speaker on this project. This is what
 * stops a multi-character CSV import from collapsing every speaker onto
 * the same default voice — only once every other voice is already taken
 * does a name start reusing one (same as the Python fallback pool logic). */
function pickVoiceForSpeaker(project: DummyAudioProject, speaker: string): VoiceOption {
  const narratorVoice = VOICE_CATALOG[0];
  if (isNarratorSpeaker(speaker)) return narratorVoice;

  const usedVoices = new Set(
    Object.entries(project.speakers)
      .filter(([name]) => !isNarratorSpeaker(name))
      .map(([, assignment]) => assignment.voice),
  );
  let pool = VOICE_CATALOG.filter((v) => v.value !== narratorVoice.value && !usedVoices.has(v.value));
  if (pool.length === 0) {
    pool = VOICE_CATALOG.filter((v) => v.value !== narratorVoice.value);
  }
  if (pool.length === 0) {
    pool = VOICE_CATALOG;
  }
  return pool[stableIndex(speaker, pool.length)];
}

/** Default speaker/style/emotion/voice a freshly-created scene gets before
 * anyone edits it. With no project context (e.g. hardcoded seed data) this
 * just falls back to "Narrator" reading in a calm, narrative style with the
 * first voice in the catalog, matching the reference design's un-customized
 * rows. When a project IS supplied, the voice comes from
 * `pickVoiceForSpeaker` instead, so every new speaker gets a distinct,
 * stable voice rather than everyone defaulting to the same one. */
function defaultSceneFields(
  speaker = "Narrator",
  project?: DummyAudioProject,
): Pick<DummyScene, "speaker" | "style" | "emotion" | "voice" | "gender" | "speed" | "pitch"> {
  const voice = project ? pickVoiceForSpeaker(project, speaker) : VOICE_CATALOG[0];
  return {
    speaker,
    style: "Narrative",
    emotion: "Calm",
    voice: voice.value,
    gender: voice.gender,
    speed: 1,
    pitch: 1,
  };
}

function touchSavedAt(project: DummyAudioProject): void {
  project.lastSavedAt = new Date().toISOString();
}

function seedAudioProjects(): void {
  const scene1: DummyScene = {
    id: makeId("scene"),
    orderIndex: 0,
    sceneNumber: 1,
    title: "Cold open",
    text: "The city never slept, and neither did she.",
    status: "COMPLETED",
    storageKey: "dummy/scene-1.wav",
    ...defaultSceneFields("Narrator"),
  };
  const scene2: DummyScene = {
    id: makeId("scene"),
    orderIndex: 1,
    sceneNumber: 2,
    title: null,
    text: "Somewhere below, a door creaked open — slowly, like it wanted to be heard.",
    status: "PENDING",
    storageKey: null,
    ...defaultSceneFields("Narrator"),
  };

  const project: DummyAudioProject = {
    projectId: makeId("project"),
    audioProjectId: makeId("audio-project"),
    name: "Episode 1 — Pilot Narration",
    status: "ACTIVE",
    defaultFormat: "mp3",
    scenes: [scene1, scene2],
    exports: [],
    speakers: { Narrator: { voice: VOICE_CATALOG[0].value, gender: VOICE_CATALOG[0].gender } },
    lastSavedAt: new Date().toISOString(),
  };

  dummyState.audioProjects.set(project.audioProjectId, project);
}
// Guarded by `dummyState.seeded` (not a plain module-load-time call) so that
// re-requiring this module — which dev mode's on-demand entries can do more
// than once for the same underlying `globalThis`-backed store — doesn't pile
// up duplicate "Episode 1 — Pilot Narration" seed projects.
if (!dummyState.seeded) {
  seedAudioProjects();
  dummyState.seeded = true;
}

function requireProject(audioProjectId: string): DummyAudioProject {
  const project = dummyState.audioProjects.get(audioProjectId);
  if (!project) {
    throw new Error("Audio project not found.");
  }
  return project;
}

export interface DummyProjectSummary {
  id: string;
  name: string;
  status: string;
  audioProject: { id: string; _count: { scenes: number } } | null;
}

export function listAudioProjects(): DummyProjectSummary[] {
  return Array.from(dummyState.audioProjects.values()).map((project) => ({
    id: project.projectId,
    name: project.name,
    status: project.status,
    audioProject: { id: project.audioProjectId, _count: { scenes: project.scenes.length } },
  }));
}

export function createAudioProject(
  name: string,
  options?: { defaultVoice?: string; language?: string },
): string {
  const project: DummyAudioProject = {
    projectId: makeId("project"),
    audioProjectId: makeId("audio-project"),
    name,
    status: "ACTIVE",
    defaultFormat: "mp3",
    scenes: [],
    exports: [],
    defaultVoice: options?.defaultVoice,
    language: options?.language,
    speakers: { Narrator: { voice: VOICE_CATALOG[0].value, gender: VOICE_CATALOG[0].gender } },
    lastSavedAt: new Date().toISOString(),
  };
  dummyState.audioProjects.set(project.audioProjectId, project);
  return project.audioProjectId;
}

export interface DummySceneDetail {
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

export interface DummyAudioProjectDetail {
  id: string;
  defaultFormat: string;
  defaultVoice?: string;
  language?: string;
  lastSavedAt: string;
  project: { id: string; name: string; ownerId: string };
  scenes: DummySceneDetail[];
  exports: DummyExport[];
  speakers: Record<string, { voice: string; gender: "Male" | "Female" }>;
}

function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

export function getAudioProjectDetail(audioProjectId: string): DummyAudioProjectDetail {
  const project = requireProject(audioProjectId);
  return {
    id: project.audioProjectId,
    defaultFormat: project.defaultFormat,
    defaultVoice: project.defaultVoice,
    language: project.language,
    lastSavedAt: project.lastSavedAt,
    project: { id: project.projectId, name: project.name, ownerId: DUMMY_USER.id },
    scenes: [...project.scenes]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((scene) => ({
        id: scene.id,
        orderIndex: scene.orderIndex,
        status: scene.status,
        sceneNumber: scene.sceneNumber,
        title: scene.title,
        text: scene.text,
        speaker: scene.speaker,
        style: scene.style,
        emotion: scene.emotion,
        voice: scene.voice,
        gender: scene.gender,
        speed: scene.speed,
        pitch: scene.pitch,
        words: wordCount(scene.text),
        characters: scene.text.length,
        credits: creditsForCharacters(scene.text.length),
        generations: scene.storageKey ? [{ storageKey: scene.storageKey }] : [],
      })),
    exports: project.exports,
    speakers: project.speakers,
  };
}

function ensureSpeaker(project: DummyAudioProject, speaker: string, voice: string, gender: "Male" | "Female"): void {
  if (!project.speakers[speaker]) {
    project.speakers[speaker] = { voice, gender };
  }
}

export function addScene(audioProjectId: string, text: string, title?: string, speaker = "Narrator"): void {
  const project = requireProject(audioProjectId);
  const fields = project.speakers[speaker]
    ? { ...defaultSceneFields(speaker, project), voice: project.speakers[speaker].voice, gender: project.speakers[speaker].gender }
    : defaultSceneFields(speaker, project);
  ensureSpeaker(project, speaker, fields.voice, fields.gender);
  project.scenes.push({
    id: makeId("scene"),
    orderIndex: project.scenes.length,
    sceneNumber: project.scenes.length + 1,
    title: title ?? null,
    text,
    status: "PENDING",
    storageKey: null,
    ...fields,
  });
  touchSavedAt(project);
}

export function deleteScene(audioProjectId: string, sceneId: string): void {
  const project = requireProject(audioProjectId);
  project.scenes = project.scenes.filter((scene) => scene.id !== sceneId);
  touchSavedAt(project);
}

/** Backs the Scenes table's "Save Changes" button — applies a batch of
 * per-scene field edits (title/text/speaker/style/emotion/voice/gender/
 * speed/pitch) made locally in the table before the user saves. Only the
 * fields present in each update are touched. */
export interface SceneFieldUpdate {
  id: string;
  title?: string | null;
  text?: string;
  speaker?: string;
  style?: string;
  emotion?: string;
  voice?: string;
  gender?: "Male" | "Female";
  speed?: number;
  pitch?: number;
}

export function bulkUpdateScenes(audioProjectId: string, updates: SceneFieldUpdate[]): void {
  const project = requireProject(audioProjectId);
  const byId = new Map(project.scenes.map((s) => [s.id, s]));
  for (const update of updates) {
    const scene = byId.get(update.id);
    if (!scene) continue;
    if (update.title !== undefined) scene.title = update.title;
    if (update.text !== undefined) scene.text = update.text;
    if (update.speaker !== undefined) scene.speaker = update.speaker;
    if (update.style !== undefined) scene.style = update.style;
    if (update.emotion !== undefined) scene.emotion = update.emotion;
    if (update.voice !== undefined) scene.voice = update.voice;
    if (update.gender !== undefined) scene.gender = update.gender;
    if (update.speed !== undefined) scene.speed = update.speed;
    if (update.pitch !== undefined) scene.pitch = update.pitch;
    if (update.speaker !== undefined || update.voice !== undefined || update.gender !== undefined) {
      ensureSpeaker(project, scene.speaker, scene.voice, scene.gender);
    }
  }
  touchSavedAt(project);
}

/** "Apply Voice to Speaker" — bulk-assigns one voice/gender to every scene
 * spoken by a given character in one shot, instead of editing each scene's
 * Voice cell individually. Also updates the project's speaker registry so
 * new scenes added later for that speaker default to the same voice. */
export function applyVoiceToSpeaker(
  audioProjectId: string,
  speaker: string,
  voice: string,
  gender: "Male" | "Female",
): number {
  const project = requireProject(audioProjectId);
  let affected = 0;
  for (const scene of project.scenes) {
    if (scene.speaker === speaker) {
      scene.voice = voice;
      scene.gender = gender;
      affected++;
    }
  }
  project.speakers[speaker] = { voice, gender };
  touchSavedAt(project);
  return affected;
}

/** "Reset Selected to Pending" — puts chosen scenes back to PENDING (e.g.
 * after tweaking their voice/style so they get regenerated), clearing any
 * previously generated audio. */
export function resetScenesToPending(audioProjectId: string, sceneIds: string[]): number {
  const project = requireProject(audioProjectId);
  const idSet = new Set(sceneIds);
  let affected = 0;
  for (const scene of project.scenes) {
    if (idSet.has(scene.id) && scene.status !== "PENDING") {
      scene.status = "PENDING";
      scene.storageKey = null;
      affected++;
    }
  }
  touchSavedAt(project);
  return affected;
}

export interface ImportScenesResult {
  imported: number;
  rowErrors: string[];
}

/** Real RFC4180-ish CSV parsing: handles quoted fields (with embedded
 * commas, embedded newlines, and doubled `""` escaped quotes), auto-detects
 * comma vs semicolon vs tab as the delimiter, and strips a leading UTF-8
 * BOM. This replaced a naive `line.split(",")` that shattered any row whose
 * text contained a comma inside quotes (common in real exports — e.g. a
 * "style"/"voice description" column like `"Gothic fiction, suspenseful..."`
 * — which shifted every column after it and truncated/garbled `text`). */
function parseCsvRows(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, "");
  const sample = text.slice(0, 2000);
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0 };
  for (const ch of sample) {
    if (ch in counts) counts[ch]++;
  }
  const delimiter = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[1] ?? 0) > 0
    ? Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
    : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else if (ch === "\r") {
      // swallow; \r\n handled via the following \n, bare \r treated the same
      if (text[i + 1] !== "\n") {
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
      }
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

function normalizeHeaderName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Canonical scene field -> accepted header aliases (normalized: lowercase,
 * letters/digits only, so "Scene Title", "scene_title" and "SceneTitle" all
 * match). Mirrors the alias table the Python ai-voice-generator's CSV
 * importer uses, trimmed to the fields this app's scene model actually has
 * (no per-scene language/story grouping/output-file columns here). */
const CSV_COLUMN_ALIASES: Record<string, string[]> = {
  text: ["text", "scenetext", "content", "body", "dialogue", "line", "script", "sentence", "paragraph", "narration", "speech"],
  title: ["title", "scenetitle", "sceneheading", "heading", "sectiontitle", "chaptertitle", "name"],
  speaker: ["speaker", "character", "who", "role", "voicecharacter", "actor", "person"],
  voice: ["voice", "voicename", "ttsvoice", "voiceid"],
  gender: ["gender", "sex", "voicegender", "charactergender"],
  style: ["style", "speakingstyle", "tone", "delivery"],
  emotion: ["emotion", "mood", "feeling", "sentiment"],
  sceneNumber: ["scenenumber", "sceneorder", "order", "sequence", "seq", "index", "no", "number", "srno", "sr", "position"],
  speed: ["speed", "rate", "speakingrate", "tempo"],
  pitch: ["pitch", "tonepitch", "voicepitch"],
};

function mapCsvColumns(header: string[]): Map<string, number> {
  const normalized = header.map(normalizeHeaderName);
  const mapping = new Map<string, number>();
  const used = new Set<number>();
  for (const [canonical, aliases] of Object.entries(CSV_COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const target = normalizeHeaderName(alias);
      const index = normalized.findIndex((name, i) => name === target && !used.has(i));
      if (index !== -1) {
        mapping.set(canonical, index);
        used.add(index);
        break;
      }
    }
  }
  return mapping;
}

/** Flexible CSV import: column names are matched case-insensitively against
 * a broad alias table (so "scene_title", "Scene Title", "character", "who",
 * etc. all resolve correctly — not just an exact literal "title"/"speaker"),
 * and rows are parsed with real quote-aware CSV parsing so a comma inside a
 * quoted field (e.g. a long style/voice-description column) no longer
 * shifts every later column and mangles `text`. Only `text` is required;
 * everything else is inferred or defaulted, same spirit as the desktop
 * Python importer this mirrors. */
export function importScenesFromCsv(audioProjectId: string, csvText: string): ImportScenesResult {
  const project = requireProject(audioProjectId);
  const rows = parseCsvRows(csvText);

  if (rows.length === 0) {
    return { imported: 0, rowErrors: ["CSV file is empty."] };
  }

  const header = rows[0];
  const mapping = mapCsvColumns(header);

  if (!mapping.has("text")) {
    return {
      imported: 0,
      rowErrors: [
        `CSV is missing a required "text" column. Expected one of: ${CSV_COLUMN_ALIASES.text.join(", ")}.`,
      ],
    };
  }

  const value = (row: string[], canonical: string): string => {
    const index = mapping.get(canonical);
    if (index === undefined || index >= row.length) return "";
    return (row[index] ?? "").trim();
  };

  const rowErrors: string[] = [];
  let imported = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1; // header is row 1, so the first data row is row 2
    const text = value(row, "text");
    if (!text) {
      rowErrors.push(`Row ${rowNumber}: missing "text" value.`);
      continue;
    }

    const title = value(row, "title") || undefined;
    const speaker = value(row, "speaker") || "Narrator";
    const fields = project.speakers[speaker]
      ? { ...defaultSceneFields(speaker, project), voice: project.speakers[speaker].voice, gender: project.speakers[speaker].gender }
      : defaultSceneFields(speaker, project);

    const styleValue = value(row, "style");
    if (styleValue) fields.style = styleValue;
    const emotionValue = value(row, "emotion");
    if (emotionValue) fields.emotion = emotionValue;

    // Match a CSV voice value against the catalog either exactly ("Achird -
    // Friendly") or against just the bare name before the " - " ("Achird")
    // — the Python reference project's voice names are bare like this, so
    // without this looser match every one of its sample CSVs would report
    // every voice as "unknown" even though the character clearly meant it.
    const voiceRaw = value(row, "voice");
    if (voiceRaw) {
      const needle = voiceRaw.toLowerCase();
      const matchedVoice = VOICE_CATALOG.find((v) => {
        const full = v.value.toLowerCase();
        const bareName = full.split(" - ")[0];
        return full === needle || bareName === needle;
      });
      if (matchedVoice) {
        fields.voice = matchedVoice.value;
        fields.gender = matchedVoice.gender;
      } else {
        // Unrecognized voice name (e.g. a voice from a different TTS engine
        // that isn't in this catalog at all) — rather than silently
        // collapsing to whatever `fields.voice` already defaulted to, fall
        // through to the same distinct-per-speaker assignment new speakers
        // get, so a CSV full of unmatched voice names still comes out with
        // varied voices instead of everyone landing on the same one.
        rowErrors.push(`Row ${rowNumber}: unknown voice "${voiceRaw}"; assigned "${fields.voice}" instead.`);
      }
    }

    const genderRaw = value(row, "gender").toLowerCase();
    if (genderRaw === "male" || genderRaw === "m") fields.gender = "Male";
    else if (genderRaw === "female" || genderRaw === "f") fields.gender = "Female";

    const speedRaw = value(row, "speed");
    if (speedRaw) {
      const parsed = Number(speedRaw);
      if (!Number.isNaN(parsed)) fields.speed = parsed;
    }
    const pitchRaw = value(row, "pitch");
    if (pitchRaw) {
      const parsed = Number(pitchRaw);
      if (!Number.isNaN(parsed)) fields.pitch = parsed;
    }

    ensureSpeaker(project, speaker, fields.voice, fields.gender);

    const sceneNumberRaw = value(row, "sceneNumber");
    const parsedSceneNumber = sceneNumberRaw ? parseInt(sceneNumberRaw, 10) : NaN;

    project.scenes.push({
      id: makeId("scene"),
      orderIndex: project.scenes.length,
      sceneNumber: Number.isNaN(parsedSceneNumber) ? project.scenes.length + 1 : parsedSceneNumber,
      title: title ?? null,
      text,
      status: "PENDING",
      storageKey: null,
      ...fields,
    });
    imported++;
  }

  touchSavedAt(project);
  return { imported, rowErrors };
}

/**
 * Dummy mode has no real TTS provider, queue, or worker — generation just
 * completes instantly and points at the shared silent placeholder file.
 * Each completed scene "costs" its credit estimate (see
 * creditsForCharacters) — deducted from the same credit balance the topbar
 * and billing page show, so the Scenes table's "Credits Required" number
 * actually means something once you hit Generate.
 */
export function generateSceneAudio(sceneId: string): { audioProjectId: string } {
  for (const project of dummyState.audioProjects.values()) {
    const scene = project.scenes.find((s) => s.id === sceneId);
    if (scene) {
      scene.status = "COMPLETED";
      scene.storageKey = `dummy/${scene.id}.wav`;
      addCredits(-creditsForCharacters(scene.text.length));
      touchSavedAt(project);
      return { audioProjectId: project.audioProjectId };
    }
  }
  throw new Error("Scene not found.");
}

export function generateAllPendingScenes(audioProjectId: string): { queued: number; failures: string[] } {
  const project = requireProject(audioProjectId);
  let queued = 0;
  for (const scene of project.scenes) {
    if (scene.status === "PENDING" || scene.status === "FAILED") {
      scene.status = "COMPLETED";
      scene.storageKey = `dummy/${scene.id}.wav`;
      addCredits(-creditsForCharacters(scene.text.length));
      queued++;
    }
  }
  touchSavedAt(project);
  return { queued, failures: [] };
}

export function requestExport(audioProjectId: string, sceneIds: string[], type: "CHUNK" | "MERGED"): void {
  const project = requireProject(audioProjectId);
  const extension = type === "MERGED" ? "mp3" : "zip";
  project.exports.unshift({
    id: makeId("export"),
    type,
    sceneIds,
    storageKey: `dummy/export-${makeId("file")}.${extension}`,
    createdAt: new Date().toISOString(),
  });
}

/** Dummy mode has no real object storage/presigned URLs — every storage
 * key resolves to the same playable placeholder file. */
export function getSignedAudioUrl(_storageKey: string): string {
  return DUMMY_AUDIO_DATA_URL;
}
