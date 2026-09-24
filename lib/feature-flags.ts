// Central on/off switches for a few Scenes-table columns — kept in their own
// plain JSON file (`feature-flags.data.json`, sitting right next to this
// file) instead of hardcoded booleans inside the table component,
// specifically so a future admin dashboard has one small, well-known file
// to overwrite. (Named "*.data.json" rather than "feature-flags.json" to
// avoid a same-basename module resolution clash with this "feature-flags.ts"
// file — some loaders/bundlers pick the .json over the .ts for an
// extensionless import when both share a base name.)
// Whoever builds that dashboard can either:
//   (a) keep writing to lib/feature-flags.data.json directly (simplest — no
//       code change needed here at all), or
//   (b) swap `getFeatureFlags()`'s body below to fetch the same shape from
//       an API route / database table instead of the static file.
// Either way, every place that imports `FEATURE_FLAGS` (or calls
// `getFeatureFlags()`) picks up the new config automatically — nothing else
// in the app needs to change.
//
// Current meaning of each flag (Scenes table, app/(app)/audio/[audioProjectId]/project-workspace.tsx):
//   pitch      -> show/hide the "Pitch" column
//   speed      -> show/hide the "Speed" column
//   words      -> show/hide the "Words" column
//   characters -> show/hide the "Chars" (character count) column
// Setting a flag to `false` only hides that column in the UI — the
// underlying scene data (lib/dummy-data.ts) still stores/tracks speed,
// pitch, word count, and character count regardless, so nothing is lost if
// a flag gets flipped back to `true` later. Credits calculations
// (creditsForCharacters) also keep working off the real character count
// even when the "Chars" column itself is hidden.
import rawFlags from "./feature-flags.data.json";

export interface FeatureFlags {
  pitch: boolean;
  speed: boolean;
  words: boolean;
  characters: boolean;
}

export function getFeatureFlags(): FeatureFlags {
  return rawFlags as FeatureFlags;
}

export const FEATURE_FLAGS: FeatureFlags = getFeatureFlags();
