# AI Context / Handoff Notes — read this first

This file exists so that any AI assistant (or human) picking up this repo cold
can get oriented in five minutes instead of re-discovering everything from
scratch. It explains what this project actually is, what's real vs. fake,
where the important logic lives, what's already been fixed, and what's still
broken. Read this before touching code.

## What this project is

A Next.js 14 (App Router, TypeScript) web app called "AutoCanvas" — a
multi-module AI content creation platform (audio narration, script, image,
video, etc.). Only the **Audio Studio** module (`app/(app)/audio/**`) is
actually built out with real UI/logic right now; the other module folders
(`images`, `videos`, `music`, `thumbnails`, `sound-effects`, `workflows`,
`assets`, `templates`, `script`) are mostly placeholder pages.

The Audio Studio lets a user create an "audio project," add narration
"scenes" (text + speaker + voice + style/emotion/speed/pitch), import scenes
in bulk from a CSV/TSV/TXT file, and (in theory) generate TTS audio for them.

## The most important thing to understand: this app runs in "dummy mode"

There is a real Prisma schema (`packages/database/prisma/schema.prisma`) and
real `packages/auth`, `packages/billing`, `packages/credits` packages that
describe what a *production* version of this app would look like (Postgres,
NextAuth, Stripe/Razorpay billing, a credits ledger, etc.). **None of that is
actually wired up to a live database in this checkout.** There's no
`DATABASE_URL` configured to a real Postgres instance, and no working Prisma
client generation in this environment.

Instead, the entire Audio Studio module runs on **`lib/dummy-data.ts`** — an
in-memory, fake "database" that pretends to be the real thing. Every server
action in `app/(app)/audio/actions.ts` calls into functions exported from
`lib/dummy-data.ts` (`createAudioProject`, `importScenesFromCsv`, `addScene`,
`bulkUpdateScenes`, `applyVoiceToSpeaker`, `generateSceneAudio`, etc.)
instead of touching Prisma. There is no real TTS engine either — "generating
audio" just returns a tiny silent WAV data URL (`DUMMY_AUDIO_DATA_URL`) so
playback/download links resolve to something real instead of a dead link.

**Implication for future work:** if someone asks you to "connect this to the
real database" or "make audio generation actually work," that is a
substantial new feature (wiring Prisma + a real TTS provider like Gemini/
ElevenLabs), not a bug fix. Don't assume dummy mode is a mistake — it's the
deliberate current state of the app so the UI/UX can be built and iterated on
without needing real infra.

### Why `lib/dummy-data.ts` uses a `globalThis`-backed singleton

Next.js dev mode recompiles/re-requires route modules on demand, which can
re-execute a module's top-level code more than once for what should be one
long-lived process. A plain `const audioProjects = new Map()` at module scope
got wiped/duplicated across those re-requires, causing a real bug we fixed:
creating a project in one request and then immediately loading it in the next
request would throw "Audio project not found." The fix stores all dummy
state on `globalThis` (see the `DummyGlobalState` interface and `dummyState`
object near the top of the file) so it survives module re-evaluation. If you
ever see stale/duplicated in-memory data or "not found" errors that seem to
come and go across requests, this pattern is why, and it should stay in place.

## Key files

- **`lib/dummy-data.ts`** — the actual business logic and in-memory "DB" for
  the Audio Studio. This is the file to read first. Notable exports:
  - `VOICE_CATALOG` — the fixed list of 7 fake TTS voices the UI offers
    (`Zephyr - Bright`, `Achird - Friendly`, `Sadaltager - Knc`, `Orus -
    Firm`, `Algenib - Gravell`, `Aoede - Warm`, `Callirrhoe - Energetic`).
    There is no real TTS behind these; picking one just gets saved and shown
    back.
  - `STYLE_OPTIONS` / `EMOTION_OPTIONS` — small lists of *suggested* values
    only. `DummyScene.style` / `.emotion` are plain `string` fields end to
    end (model, actions, UI) — NOT restricted enums. Don't reintroduce a
    `<select>` limited to these lists in the UI; see "Fixed bugs" below for
    why that was actively wrong.
  - `parseCsvRows` / `normalizeHeaderName` / `CSV_COLUMN_ALIASES` /
    `mapCsvColumns` / `importScenesFromCsv` — a real, quote-aware CSV/TSV
    parser with delimiter auto-detection and a broad case/punctuation-
    insensitive header alias table (so "Scene Title", "scene_title", and
    "character" all map to the right field). This mirrors the column-alias
    approach used by the user's separate Python reference project
    (`ai-voice-generator`, a desktop PySide6 app — not part of this repo, but
    referenced heavily during development as the "this is how it's supposed
    to behave" source of truth for CSV import semantics).
  - `stableIndex` / `pickVoiceForSpeaker` / `isNarratorSpeaker` — deterministic
    per-speaker voice assignment. When a CSV row's speaker doesn't already
    have a voice registered on the project, this assigns a *stable* (same
    speaker name → same voice, every import) but *distinct* voice pulled
    from whichever catalog voices aren't already taken by another speaker —
    mirroring the Python reference's `SpeakerDetector._stable_index`
    polynomial-hash-into-unused-pool approach. Narrator always gets
    `VOICE_CATALOG[0]`. This exists specifically because the naive version
    used to default every unmatched speaker to the same first voice, so a
    multi-character CSV import made every character sound the same.
  - `ensureSpeaker` — only registers a speaker's voice the *first* time;
    later scenes for the same speaker reuse whatever was registered.
- **`app/(app)/audio/actions.ts`** — Next.js Server Actions that are the only
  bridge between the UI and `lib/dummy-data.ts`. No Prisma calls here.
- **`app/(app)/audio/action-forms.tsx`** — client-side forms (Add Scene, CSV
  Import, Export) used on the Story tab.
- **`app/(app)/audio/[audioProjectId]/project-workspace.tsx`** — the big
  Story/Scenes/Generate tabbed workspace component. The Scenes tab renders an
  editable data-grid table (one `<tr>` per scene) with bulk actions.
- **`app/(app)/audio/catalogs.ts`** — just re-exports `VOICE_CATALOG`,
  `STYLE_OPTIONS`, `EMOTION_OPTIONS` from `lib/dummy-data.ts` for client
  components that can't import server-only code paths directly.
- **`packages/database/prisma/schema.prisma`** — the *intended* real schema.
  Useful as a design reference (it documents its own principles at the top of
  the file) but not currently connected to anything live.
- **`packages/auth`, `packages/billing`, `packages/credits`** — real,
  independent workspace packages with their own tests (`*.test.ts`). These
  are more fleshed out than the database wiring but are exercised through the
  dummy-data layer in the Audio Studio, not live Prisma/Stripe calls.

## Known pre-existing issue (NOT caused by dummy-data.ts, out of scope so far)

`npm run build` fails at the "Collecting page data" step with:

```
Error: @prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.
Error: Failed to collect page data for /api/webhooks/stripe (and /razorpay)
```

This is because `app/api/webhooks/stripe` and `.../razorpay` import from
`packages/billing`, which imports `@prisma/client` transitively, and this
checkout has never run `prisma generate` against a real schema/DB. `npx tsc
--noEmit` passes clean and `npm run dev` boots and serves pages fine — it's
specifically Next's production build page-data-collection step for those two
webhook routes that fails. This has been present since before any of the
fixes below and was deliberately left alone as out of scope (fixing it means
either wiring a real Postgres DB + running `prisma generate`, or stubbing the
billing package's Prisma usage — a decision for whoever owns that part of the
app, not a quick fix).

## Fixes already made in this checkout (so you don't redo them)

1. **`globalThis` singleton for dummy state** (see above) — fixed "Audio
   project not found" crashes caused by Next dev-mode module re-evaluation
   duplicating the in-memory store.
2. **CSV import column matching** — was a naive `header.indexOf("title")`
   that missed real-world headers like `scene_title`. Replaced with the
   alias-table approach (`CSV_COLUMN_ALIASES` / `mapCsvColumns`).
3. **CSV import quote-awareness** — was a naive `line.split(",")` that
   shattered rows whose quoted fields contained commas. Replaced with a real
   char-by-char CSV/TSV parser (`parseCsvRows`) with delimiter sniffing.
4. **Voice diversity on import** — every speaker with an unmatched/missing
   voice used to collapse onto the same default voice (`VOICE_CATALOG[0]`,
   "Zephyr - Bright"). Fixed with `pickVoiceForSpeaker`'s stable-hash-into-
   unused-pool assignment (see above). Also loosened voice-name matching to
   accept a bare name ("Achird") against a labeled catalog entry ("Achird -
   Friendly"), since the Python reference project's voice names are bare.
5. **`#` and `Title` were visually merged into one table column** — the
   Scenes table had a single `<th>Scene</th>` header with both the scene
   number and a Title `<input>` stacked inside one `<td>`. Split into two
   real columns/cells (`#` and `Title`) to match the intended design.
6. **Style/Emotion showed "Calm"/"Narrative" no matter what the CSV said** —
   root cause was NOT the data (imported values were already stored
   correctly as free text). It was that the Scenes table rendered Style and
   Emotion as `<select>` dropdowns limited to `STYLE_OPTIONS`/
   `EMOTION_OPTIONS`, so any imported value outside that tiny fixed list
   (e.g. "warm", "tender", "calm storytelling") had nowhere to display and
   the browser fell back to showing the first `<option>`. Since the
   underlying model (`DummyScene.style`/`.emotion`) is plain `string`, not an
   enum, the fix was to change those two cells to free-text `<input>`s with
   an HTML `<datalist>` of the old options as *suggestions only* — matches
   the Python reference project's behavior of storing whatever free-text
   style/emotion a CSV row contains, no restricted set.
7. **`.txt` files rejected by the CSV import file picker** — the file
   `<input accept=".csv,text/csv">` blocked `.txt`/`.tsv` files from even
   being selectable, even though `importScenesFromCsv`'s parser is fully
   content-based and already handles them correctly (delimiter
   auto-detection doesn't care about file extension). The Python reference
   project's own file-open dialog explicitly accepts `*.csv *.tsv *.txt` for
   this same import feature. Widened the `accept` attribute and updated the
   hint text to match.
8. **Scenes table forced the whole page to scroll** — with 40+ scenes the
   `<table>` grew tall enough that scrolling to see later rows scrolled the
   stat cards, tabs, and the Save/Generate button bar out of view too. Fixed
   by giving the table's wrapper `div` a bounded height
   (`max-h-[65vh] overflow-y-auto`) and making the `<thead>` `sticky top-0`
   within that same scroll container, so only the scene rows scroll and
   everything else (header, filters, action buttons) stays in place.

All of the above were verified with: `npx tsc --noEmit`, `npm run build`
(clean except the pre-existing Prisma/webhook issue described above), `npm
run dev` boot + `curl` 200 check, and direct `npx tsx -e "..."` scripts
importing real sample CSVs (from the user's separate Python reference
project's `samples/` folder — `full.csv`, `template.csv`, `minimum.csv`) to
confirm titles, voices, and row counts came out correct.

## If you're an AI picking this up: how to verify your own changes

```bash
cd autocanvas-web
npm install
npx tsc --noEmit -p tsconfig.json       # should be clean
npm run build                            # clean except the known Prisma/webhook error above
npm run dev                              # boots; curl localhost:3000 should 200
```

There is no automated test suite for the Audio Studio / dummy-data layer
itself (the `*.test.ts` files that exist live under `packages/billing` and
`packages/credits` and don't touch this module) — the verification pattern
used throughout has been writing one-off `npx tsx -e "..."` scripts that call
the exported `lib/dummy-data.ts` functions directly against real sample CSV
content and asserting on the shape of the result. Do the same for any new
change to that file rather than assuming it works from reading the code.

## A note on "the Python code does this perfectly, match it"

Throughout this project's development, the user has repeatedly pointed to a
separate desktop Python project (an "ai-voice-generator" PySide6 app, not
part of this repo) as the reference for how CSV import / voice assignment /
file-format handling "should" work, because it already does these things
correctly. If you're asked to fix something and the user references "the
Python code," ask them to attach/upload it (or its relevant file) rather than
guessing — the fixes in this handoff came from reading that project's
`app/story/csv_importer.py`, `app/story/speaker_detector.py`, and
`app/gui/story_panel.py` directly.
