// Plain (non-"use server") re-export of the Scenes table's dropdown
// catalogs. actions.ts is a "use server" file and can only export async
// functions — it can't re-export these consts directly (Next.js throws
// "A 'use server' file can only export async functions" at runtime) — so
// this tiny module exists purely to give client components one shared,
// non-"use server" import path for them instead of reaching into
// lib/dummy-data.ts (a server-only module) from a "use client" file.
export { VOICE_CATALOG, STYLE_OPTIONS, EMOTION_OPTIONS } from "../../../lib/dummy-data";
export type { VoiceOption } from "../../../lib/dummy-data";
export { FEATURE_FLAGS } from "../../../lib/feature-flags";
export type { FeatureFlags } from "../../../lib/feature-flags";
