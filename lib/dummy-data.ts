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

let nextId = 1;
function makeId(prefix: string): string {
  return `${prefix}-${nextId++}`;
}

// ─────────────────────────────────────────────────────────────────────────
// Credits
// ─────────────────────────────────────────────────────────────────────────

const creditState = {
  balance: 2450,
  reserved: 0,
};

export function getCreditAccount(): { balance: number; reserved: number } {
  return { ...creditState };
}

function addCredits(amount: number): void {
  creditState.balance += amount;
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

let currentPlanKey: string | null = "creator";

export function listPlans(): DummyPlan[] {
  return DUMMY_PLANS;
}

export function getCurrentPlanKey(): string | null {
  return currentPlanKey;
}

/**
 * Dummy mode has no real payment provider to redirect to, so "checkout" is
 * simulated as an instant success: the plan switches and that plan's
 * monthly credit allotment is granted right away.
 */
export function applyDummyCheckout(planKey: string): boolean {
  const plan = DUMMY_PLANS.find((p) => p.key === planKey);
  if (!plan) return false;
  currentPlanKey = planKey;
  addCredits(plan.monthlyCredits);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────
// Audio Studio
// ─────────────────────────────────────────────────────────────────────────

export type SceneStatus = "PENDING" | "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

interface DummyScene {
  id: string;
  orderIndex: number;
  sceneNumber: number;
  title: string | null;
  text: string;
  status: SceneStatus;
  storageKey: string | null;
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
}

const audioProjects = new Map<string, DummyAudioProject>();

/** A tiny (0.05s) silent WAV, used as the "generated"/"exported" file for
 * every dummy scene and export so playback/download links resolve to a
 * real, playable file instead of a dead link — there is no real object
 * storage or TTS provider behind this. */
export const DUMMY_AUDIO_DATA_URL =
  "data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YSADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

function seedAudioProjects(): void {
  const scene1: DummyScene = {
    id: makeId("scene"),
    orderIndex: 0,
    sceneNumber: 1,
    title: "Cold open",
    text: "The city never slept, and neither did she.",
    status: "COMPLETED",
    storageKey: "dummy/scene-1.wav",
  };
  const scene2: DummyScene = {
    id: makeId("scene"),
    orderIndex: 1,
    sceneNumber: 2,
    title: null,
    text: "Somewhere below, a door creaked open — slowly, like it wanted to be heard.",
    status: "PENDING",
    storageKey: null,
  };

  const project: DummyAudioProject = {
    projectId: makeId("project"),
    audioProjectId: makeId("audio-project"),
    name: "Episode 1 — Pilot Narration",
    status: "ACTIVE",
    defaultFormat: "mp3",
    scenes: [scene1, scene2],
    exports: [],
  };

  audioProjects.set(project.audioProjectId, project);
}
seedAudioProjects();

function requireProject(audioProjectId: string): DummyAudioProject {
  const project = audioProjects.get(audioProjectId);
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
  return Array.from(audioProjects.values()).map((project) => ({
    id: project.projectId,
    name: project.name,
    status: project.status,
    audioProject: { id: project.audioProjectId, _count: { scenes: project.scenes.length } },
  }));
}

export function createAudioProject(name: string): string {
  const project: DummyAudioProject = {
    projectId: makeId("project"),
    audioProjectId: makeId("audio-project"),
    name,
    status: "ACTIVE",
    defaultFormat: "mp3",
    scenes: [],
    exports: [],
  };
  audioProjects.set(project.audioProjectId, project);
  return project.audioProjectId;
}

export interface DummySceneDetail {
  id: string;
  orderIndex: number;
  status: SceneStatus;
  sceneNumber: number;
  title: string | null;
  text: string;
  generations: Array<{ storageKey: string | null }>;
}

export interface DummyAudioProjectDetail {
  id: string;
  defaultFormat: string;
  project: { id: string; name: string; ownerId: string };
  scenes: DummySceneDetail[];
  exports: DummyExport[];
}

export function getAudioProjectDetail(audioProjectId: string): DummyAudioProjectDetail {
  const project = requireProject(audioProjectId);
  return {
    id: project.audioProjectId,
    defaultFormat: project.defaultFormat,
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
        generations: scene.storageKey ? [{ storageKey: scene.storageKey }] : [],
      })),
    exports: project.exports,
  };
}

export function addScene(audioProjectId: string, text: string, title?: string): void {
  const project = requireProject(audioProjectId);
  project.scenes.push({
    id: makeId("scene"),
    orderIndex: project.scenes.length,
    sceneNumber: project.scenes.length + 1,
    title: title ?? null,
    text,
    status: "PENDING",
    storageKey: null,
  });
}

export function deleteScene(audioProjectId: string, sceneId: string): void {
  const project = requireProject(audioProjectId);
  project.scenes = project.scenes.filter((scene) => scene.id !== sceneId);
}

export interface ImportScenesResult {
  imported: number;
  rowErrors: string[];
}

/** Minimal CSV parser — good enough for the simple, comma-separated,
 * no-embedded-commas export the CSV import form documents (text, title,
 * sceneNumber, voiceName, character, style, emotion, language,
 * targetDuration). Dummy mode only reads `text` and `title`. */
export function importScenesFromCsv(audioProjectId: string, csvText: string): ImportScenesResult {
  const project = requireProject(audioProjectId);
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { imported: 0, rowErrors: ["CSV file is empty."] };
  }

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const textIdx = header.indexOf("text");
  const titleIdx = header.indexOf("title");

  if (textIdx === -1) {
    return { imported: 0, rowErrors: ['CSV is missing a required "text" column.'] };
  }

  const rowErrors: string[] = [];
  let imported = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const text = cols[textIdx]?.trim();
    if (!text) {
      rowErrors.push(`Row ${i + 1}: missing "text" value.`);
      continue;
    }
    const title = titleIdx >= 0 ? cols[titleIdx]?.trim() || undefined : undefined;
    project.scenes.push({
      id: makeId("scene"),
      orderIndex: project.scenes.length,
      sceneNumber: project.scenes.length + 1,
      title: title ?? null,
      text,
      status: "PENDING",
      storageKey: null,
    });
    imported++;
  }

  return { imported, rowErrors };
}

/**
 * Dummy mode has no real TTS provider, queue, or worker — generation just
 * completes instantly and points at the shared silent placeholder file.
 */
export function generateSceneAudio(sceneId: string): { audioProjectId: string } {
  for (const project of audioProjects.values()) {
    const scene = project.scenes.find((s) => s.id === sceneId);
    if (scene) {
      scene.status = "COMPLETED";
      scene.storageKey = `dummy/${scene.id}.wav`;
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
      queued++;
    }
  }
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
