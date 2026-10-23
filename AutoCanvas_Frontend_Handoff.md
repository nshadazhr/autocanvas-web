# AutoCanvas Audio Studio — Frontend Handoff

## 1. Project Context

Main AutoCanvas naam ka web application develop kar raha hoon.

-   Frontend: Next.js 14, TypeScript, Tailwind CSS
-   Backend: NestJS
-   Database: PostgreSQL + Prisma 7
-   Authentication: Access token + HttpOnly refresh-token cookie
-   Audio generation: Google Gemini TTS
-   Frontend API calls: Axios

**Important:** Project pehle se kaafi develop ho chuka hai. Existing functionality ko preserve karna hai. Architecture dobara design nahi karna.

Maine previous chat me frontend ka `src(4).zip` upload kiya tha. New chat me bhi ye ZIP attach karunga.

## 2. Existing Frontend Structure

Relevant files:

```text
src/
├── app/
│   ├── api/
│   │   ├── axios.ts
│   │   └── audio-studio/
│   │       ├── audio-stories.api.ts
│   │       ├── audio-stories.types.ts
│   │       └── voices.api.ts
│   │
│   └── (app)/audio/
│       ├── page.tsx
│       ├── audio-studio-dashboard.tsx
│       ├── audio-stories-list.tsx
│       ├── create-project-modal.tsx
│       ├── project-cast.tsx
│       ├── hooks/use-audio-stories.ts
│       ├── stories/[storyId]/page.tsx
│       │
│       └── [audioProjectId]/
│           ├── page.tsx
│           └── project-workspace.tsx
│
├── providers/AuthProvider.tsx
└── lib/
    ├── backend-client.ts
    ├── dummy-data.ts
    └── feature-flags.ts
```

**Important distinction:** Frontend me ek older project-workspace implementation bhi hai jo `backend-client.ts` aur `dummy-data.ts` use karta hai. Naya story-based Audio Studio alag flow hai.

Current focus:

`src/app/(app)/audio/stories/[storyId]/page.tsx`

Dono implementations ko bina samjhe merge ya replace nahi karna.

## 3. Already Implemented Frontend

Uploaded source ke according:

-   Audio Stories list with search and status filtering
-   Story creation and detail page
-   Script editing
-   Story analysis API integration
-   Character/cast UI
-   Real backend voices API
-   Cast assignment and save API
-   Analyzed scenes display
-   Generate Audio tab ka basic UI

`project-cast.tsx` already backend se cast aur voices load karta hai. Isko dobara create nahi karna.

`stories/[storyId]/page.tsx` me Generate Audio tab abhi placeholder hai. Isme real audio-generation integration add karna hai.

Older `project-workspace.tsx` me generation/playback controls hain, lekin woh separate flow hai. Unhe automatically current story-based flow ka completed implementation assume nahi karna.

## 4. Existing Frontend APIs

`audio-stories.api.ts` me:

```text
GET   /audio-stories
POST  /audio-stories
GET   /audio-stories/:id
PATCH /audio-stories/:id
POST  /audio-stories/:id/analyze
GET   /audio-stories/:id/cast
PATCH /audio-stories/:id/cast
```

`voices.api.ts` me:

```text
GET /voices
```

Axios already centralized hai:

`src/app/api/axios.ts`

Isme access token request interceptor aur 401 refresh handling implemented hai. New APIs ko isi existing Axios instance se connect karna hai.

## 5. Backend Audio Generation — Already Working

Backend endpoints:

```text
POST /audio-generation/stories/:storyId/jobs
GET  /audio-generation/jobs/:jobId
POST /audio-generation/jobs/:jobId/retry
```

Generation asynchronous hai.

1. POST se job create hota hai.
2. GET se job status aur progress milti hai.
3. Failed scenes ke liye retry endpoint hai.
4. Successful scenes ka generated audio `SceneAudio` me save hota hai.

Job statuses me PENDING, PROCESSING, COMPLETED, PARTIAL aur FAILED ho sakte hain.

Backend me actual Gemini WAV generation successful test ho chuki hai.

Example:

-   Story ID: 2
-   Original job ID: 2 — PARTIAL, scene 1 completed
-   Retry job ID: 5 — COMPLETED, scene 2 completed
-   Dono scenes ki WAV files generate ho chuki hain.

Job response me items ke andar audio object milta hai:

```json
{
	"audio": {
		"id": 4,
		"filePath": "uploads/audio-stories/2/2-14d155a3-98e1-4873-8ca1-7637f0ddf2a7.wav",
		"durationMs": 3451,
		"format": "wav"
	}
}
```

NestJS `main.ts` me `useStaticAssets()` configuration add kar di gayi hai. Browser playback test ka exact result new chat me confirm kar sakte hain.

Production me audio authorization/security ko separately review karna hai.

## 6. Next Frontend Work

Ab existing story-based Generate Audio tab me integrate karna hai:

1. Generate Audio button
2. Backend generation-job creation
3. Job progress polling
4. Scene-wise generation status
5. Completed audio playback
6. Failed scene retry
7. Existing generated audio ko page reload ke baad bhi show karna

Important: Original job aur retry job me completed audio alag jobs me ho sakta hai. Isliye playback ke liye sirf latest job par depend nahi karna. Existing backend read APIs inspect karke correct approach choose karna.

## 7. Development Rules

-   Ek time par ek step implement karna.
-   Existing code pehle read karna.
-   Unnecessary refactoring nahi.
-   Existing Prisma schema change nahi.
-   Hardcoded mock voice list nahi.
-   Existing reusable components reuse karna.
-   Local script parser enabled rehna chahiye.
-   Gemini-based AI analysis abhi global feature flag se disabled hai; Gemini TTS generation alag functionality hai.
-   Existing authentication/refresh-token logic preserve karna.
-   Exact existing variables aur function names inspect karne ke baad code suggest karna.
-   Backend generation already tested hai; unnecessary Gemini calls mat karwana.
-   Roman Hindi me explain karna: kya kar rahe hain, kyun, aur kis file me.

## 8. Where to Resume

**Next step:** Uploaded frontend ZIP inspect karke `src/app/(app)/audio/stories/[storyId]/page.tsx` ke existing Generate Audio tab me API integration start karo.

Sabse pehle current code ka review karo. Phir minimum required files aur changes batao.

Mujhe pura frontend dobara nahi banana. Existing AutoCanvas Audio Studio ko wahi se continue karna hai jahan previous chat me chhoda tha.

---

# UPDATE — 16 October 2026: Latest Audio Studio + Animation Studio Plan

> **Read this section first when resuming.** Sections 1–8 above are a historical handoff snapshot. In particular, the old “Generate Audio tab is placeholder” and “Where to Resume” statements describe an earlier stage and must **not** be treated as the latest implementation status. Verify the current uploaded source before claiming a feature works.

## 9. Audio Studio — newer implemented work (reported in later development)

-   Character Voices story-based flow advanced beyond the historical placeholder: script analysis (local parser), cast/voice assignments, scene-wise generation, status/progress, audio playback/download, and failed-scene retry have been worked on. Preserve existing Character Voices behavior and verify current code rather than rebuilding it.
-   Audio Studio UI includes a project dashboard, `/audio/create`, and story-specific screens. `/audio/create` offers **One Voice** and **Character Voices** modes.
-   **One Voice / Single Voice** flow was added: selecting One Voice immediately reveals voice selection and Generate Audio/Play/Download UI on the **same Create Audio page**, without an extra Continue step. Project is created/saved when Generate is triggered; saved projects should reopen.
-   Single Voice UI design: compact desktop layout, internally scrolling voice list, visible generate/playback controls, normal scrolling on small screens. Use real backend voice API; no hardcoded voices.
-   Character Voices selection must retain its larger script editor and original Analyze Script workflow. Single Voice compact styles must not alter Character Voices layout.
-   Fixed a recent script-editor styling regression: textarea explicitly uses dark background `bg-[#1b1b23]`, light text, muted placeholder, subtle border and focus border. Its sizing depends on `voiceMode` (`single` compact; Character Voices taller). User confirmed the fix.
-   Other previously agreed Audio Studio requirements: compact searchable/filterable scene list for large stories; generation job summary/progress; scene-specific regenerate/retry; Regenerate All and Retry All Failed; custom confirmation modal for regeneration, toasts for status, hidden 24-hour Trash for successfully replaced WAVs, preserve existing audio on regeneration failure; optional infinite scroll/pagination scene navigation. **Verify which of these are actually implemented** before marking them complete.

### Single Voice review — known deferred risks (not release-blocking yet)

A prior review identified potential issues requiring verification against the latest code:

1. Duplicate project creation after failure/reload.
2. Generation stuck in `SINGLE_PROCESSING` after server restart (background task recovery).
3. Long-script chunk failure and retry resilience.
4. Saved script editing/update versus regeneration behavior.
5. WAV duration calculation from fixed offsets may be unreliable with nonstandard headers.

**Decision:** Release is not imminent; fixes are deferred. Do not change these areas without a new request. Preserve existing working features.

### Useful current-code paths to inspect

-   `src/app/(app)/audio/create/page.tsx`
-   `src/app/(app)/audio/single-voice-studio.tsx`
-   `src/app/(app)/audio/stories/[storyId]/page.tsx`
-   Frontend Single Voice API module (locate exact path in current source).
-   Backend `single-voice.service.ts`, `single-voice.controller.ts`, and existing Character Voices generation services.

## 10. Animation Studio — NEW project direction (planning approved, implementation pending)

**Goal:** Full 2D cartoon Animation Studio for scene composition, rigging, keyframes, reusable motions, Audio Studio sync, and MP4 export. Build incrementally and **do not break Audio Studio**.

**Technology direction:** Next.js/React/TypeScript UI; PixiJS canvas; custom deterministic rigging/keyframe engine; NestJS APIs; Prisma/PostgreSQL metadata; external file/object storage for assets; FFmpeg-based export later. Keep animation playback tied to timeline time/frame, not ad hoc animations.

### Milestone 1 — Foundation + Usable Scene Editor (FIRST implementation target)

-   Dashboard: list/create/open/delete animation projects.
-   Project settings: name, resolution (default 1920x1080 / 16:9), FPS.
-   Scenes: add, rename, duplicate, delete, reorder.
-   Dark editor shell with asset library, central PixiJS stage, properties inspector, scenes/layers panels.
-   Canvas zoom/pan; asset import PNG/JPG/WebP, including transparent character images; categorize characters/backgrounds/props.
-   Place/select/move/scale/rotate/flip objects; edit position, size, rotation, opacity.
-   Layer order, visibility and lock; undo/redo; real API save/load and reopen.

**Milestone 1 delivery steps:**

1. Animation dashboard + project APIs + scene CRUD + editor layout.
2. PixiJS stage + asset import/library + object manipulation + layers.
3. Undo/redo + persistence/reopen + regression tests.

**Acceptance:** Create project and scenes, import background and character, arrange them on stage, save/reopen with identical scene composition; Audio Studio remains unchanged.

### Remaining approved milestones

2. **Rigging Editor:** transparent body-part assembly, bones, pivots, joint hierarchy, rig templates.
3. **Timeline + Keyframes:** frame-based tracks, interpolation, pose animation, playback/seek, saved clips.
4. **Reusable Motion Library:** idle/walk/run/talk/wave/sit presets and rig compatibility/retargeting.
5. **Audio Studio Integration:** reference generated WAVs, narration/dialogue mapping, mouth poses and lip sync.
6. **Advanced Character Controls:** IK, constraints, facial controls, optional mesh deformation/blending.
7. **Render + Export:** deterministic frames, FFmpeg MP4, audio mix, jobs/progress/download.
8. **Stability + Performance:** autosave/recovery, JSON versioning/migration, optimization and regression tests.

### Architectural guardrails

-   Separate character artwork, reusable rig templates, animation clips, and scene instances.
-   Use real API data and reusable components; no premature schema redesign.
-   Preserve originals (non-destructive assets); provide undoable editing commands.
-   Keep rendering engine state separate from React UI rendering.
-   Validate future export feasibility early, even though rendering is Milestone 7.
-   The **body-part PNG vs layered PSD/SVG primary import strategy remains undecided**; do not assume PSD/SVG support in Milestone 1.

## 11. Next action / handoff instructions (supersedes historical Section 8)

1. Start **Animation Studio Milestone 1, Step 1** only after inspecting the latest complete frontend/backend code uploaded by the user.
2. Implement incrementally, preserve the current Audio Studio, and avoid touching Character Voices/Single Voice logic unless strictly necessary.
3. Provide only changed files in ZIP archives, preserving source folder paths; explain what changed and what was actually tested.
4. Do not mark Animation Studio features implemented until corresponding code is delivered and verified. **As of this handoff, Animation Studio remains planned, not implemented.**
5. Maintain the separate detailed plan `AutoCanvas_Animation_Studio_Milestones.md` alongside this frontend handoff.

# Story analysis reliability and Gemini usage protection

Story analysis and audio generation use separate persisted jobs. Analysis submission returns HTTP 202 with safe job metadata; the story details endpoint includes the latest analysis job. The frontend polls while analysis is active and exposes waiting/retry time and cancellation.

## Analysis behavior

-   A valid structured script uses the local parser; other scripts use Gemini. Both paths validate the result before saving characters/scenes.
-   Concurrent submissions for one story reuse its active job. Completed unchanged analysis is reused without another provider call.
-   Overload (503), rate limits (429), temporary server failures, and network/timeouts move the same job into WAITING. Exponential backoff starts around 30 seconds, reaches about five minutes, adds jitter, and respects Retry-After and persisted application quota reset times. Temporary failures continue retrying until success or cancellation.
-   Invalid JSON/schema responses get up to three attempts. Permanent authorization or input errors stop with a safe message; provider availability cannot be guaranteed.
-   PostgreSQL stores the script snapshot, attempts, retry time and worker lease. A scanner runs every ten seconds, recovers expired leases, and resumes queued/due work after restart. Provider requests time out after 90 seconds; worker leases last 120 seconds and renew every 15 seconds.
-   Cancellation and script edits fence old results. A running provider request may still finish and incur usage, but its result cannot overwrite the changed/cancelled story.
-   Existing in-flight synchronous analyses from before this migration have no durable snapshot and are marked interrupted, with a message asking the user to submit again.

## Server-side limits

The backend `.env.example` documents configurable defaults. PostgreSQL accounting is shared by Gemini story analysis, TTS and restricted diagnostic calls, across application instances and restarts.

| Protection                         | Default                        |
| ---------------------------------- | ------------------------------ |
| Analysis submissions per user      | 3/minute, 30/day               |
| Active analysis jobs per user      | 2                              |
| Global analysis workers            | 2                              |
| Provider calls per user            | 5/minute, 100/day              |
| Provider calls globally            | 10/minute, 300/day             |
| Provider input characters per user | 100,000/day                    |
| Provider input characters globally | 500,000/day                    |
| Concurrent provider requests       | 1/user, 3 globally             |
| Analysis script / scene count      | 30,000 characters / 200 scenes |
| Analysis output                    | 16,384 tokens per request      |

Windows use fixed UTC boundaries. Every admitted provider attempt counts, including failed requests; a blocked attempt never calls Gemini. Duplicate analysis submissions do not consume submission quota. Quota waits preserve analysis jobs and audio generation's existing WAITING behavior. Single-voice chunks wait when the new shared application budget is busy; existing single-voice provider/restart error behavior remains separate from durable story analysis.

Diagnostics and provider voice sync default to denied; explicitly allow internal user IDs with `AI_DIAGNOSTICS_USER_IDS`. Normal voice listing remains available. Provider keys stay on the backend, and persisted audio errors redact key/token patterns. Normal users select saved voices rather than arbitrary provider credentials or models.

These request/character caps bound provider usage; they are not exact currency billing or complete protection against account farming. Paid billing/credits, provider-project spending controls and edge signup/IP controls remain separate operational controls. Limits apply to these Gemini paths, not unrelated providers/features.

## Verification

-   45 PostgreSQL integration tests passed, including existing audio flows, overload recovery, malformed output, duplicate submission, cancellation fencing, ownership, worker restart recovery, shared rate/concurrency limits, local parsing and HTTP 202/authentication.
-   Frontend production build and backend TypeScript compilation passed.
-   Mobile Chrome checks passed at 393 × 852: waiting/retry information, cancellation refresh and no horizontal overflow.
-   Live Nest/backend and dev database smoke test passed: HTTP 202, local worker completion, cached job reuse and diagnostics HTTP 403. Temporary fixtures were removed; this smoke test made no Gemini calls. Provider overload scenarios were simulated in integration tests.
-   The additive migration was applied to the user-confirmed development/test database after checking existing migration checksums. Application tables were preserved.

Backend test command (use only a disposable local database whose name ends in `_test`):

```sh
AUDIO_FLOW_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:55439/autocanvas_flow_test node_modules/.bin/vitest run --config vitest.audio-flow.config.ts
```

The migration is `20261023070000_durable_analysis_and_ai_limits` in the backend project. Deploy it before starting the updated backend elsewhere. No production deployment was performed.

# AutoCanvas — Animation Studio Implementation Milestones

**Status:** Planning approved; implementation not yet started.
**Goal:** Full 2D cartoon animation editor integrated with existing AutoCanvas, without breaking Audio Studio.
**Stack direction:** Next.js/React/TypeScript, PixiJS, NestJS, Prisma/PostgreSQL, file/object storage; later deterministic animation engine and FFmpeg export.

## Milestone 1 — Foundation + Usable Scene Editor

**Scope:**

-   Animation dashboard: list, create, open, delete projects.
-   Project settings: name, canvas resolution (default 1920×1080 / 16:9), FPS.
-   Scenes: add, rename, duplicate, delete, reorder.
-   Dark editor shell with assets, canvas, inspector, scenes/layers; responsive/resizable where practical.
-   PixiJS canvas: zoom, pan, select.
-   Import PNG (including transparency), JPG, WebP; organize as characters/backgrounds/props.
-   Place, drag, scale, rotate, flip objects; edit X/Y, dimensions, rotation, opacity.
-   Layers: visibility, lock, reorder.
-   Undo/redo; save/load through real APIs and persistent storage.
-   Reopen saved projects with scene and object transforms intact.

**Implementation steps:**

1. Dashboard + project APIs + scene CRUD + editor layout.
2. PixiJS stage + asset upload/library + object manipulation + layers.
3. Undo/redo + persistence + reopen + regression checks.

**Acceptance criteria:** A user can create a project, add scenes, import a background and character, arrange objects on a 16:9 stage, save, reload and see the same result. Existing Audio Studio works unchanged.

## Milestone 2 — Rigging Editor

-   Assemble characters from transparent body-part images.
-   Bone hierarchy, joints, pivots, default/rest pose, parent-child transforms.
-   Attach body parts to bones; rig templates; save/load.
-   Keep character artwork, rig definition, and scene instances separate.
-   Validate compatibility for rig reuse across characters.

## Milestone 3 — Timeline + Keyframe Animation

-   FPS-based timeline, play/pause/seek, tracks and keyframes.
-   Position, rotation, scale, opacity, bone pose animation.
-   Interpolation/easing; reusable animation clips; deterministic playback.
-   Save and reopen animations.

## Milestone 4 — Reusable Motion Library

-   Idle, walk, run, talk, wave, sit presets.
-   Reuse clips on compatible rigs; retargeting where needed.
-   Pose and clip library; compatibility feedback.

## Milestone 5 — Audio Studio Integration + Lip Sync

-   Import/reference existing generated WAV audio without modifying Audio Studio.
-   Narration and character dialogue tracks; speaker-to-character mapping.
-   Manual mouth poses and basic automatic lip-sync; improve viseme alignment later.

## Milestone 6 — Advanced Character Controls

-   IK, constraints, facial expressions, optional mesh deformation.
-   Animation blending and enhanced rig/pose controls.

## Milestone 7 — Render + Export

-   Deterministic frame rendering; audio mix; FFmpeg MP4 output.
-   Render jobs, status/progress, download and failure handling.
-   Validate export feasibility early during foundation design.

## Milestone 8 — Stability + Performance

-   Autosave/recovery, migration/versioned JSON, large-scene optimization.
-   Validation, browser testing, export fidelity, regression testing.

## Architectural guardrails

-   Do not change working Audio Studio/Character Voices flows unnecessarily.
-   No hardcoded fake API data in production features.
-   Reusable components; separate editor engine from React UI state.
-   Non-destructive assets; versioned project data; undoable editor actions.
-   Same timestamp/frame must produce the same visual state.
-   Keep character artwork, rig templates, animation clips, and scene objects distinct.

## Next action

Receive the user's **latest existing milestone/planning file** and update it to reflect the agreed Animation Studio plan, preserving its existing content and structure where possible. For implementation, request current complete frontend and backend code archives before editing.

# Audio generation fixes and verification

Updated 2026-10-23. Scope: `autocanvas-web` and sibling `autocanvas-api`.

## Changes completed

-   Serialize full generation, single-scene generation, retries, cast saves, and script edits with a transaction-scoped PostgreSQL advisory lock per story. Reject overlapping generation jobs with HTTP 409.
-   Validate ownership, completed analysis, nonempty scene text, supported providers, active voices, and current voice configuration before creating jobs.
-   Pick up persisted PENDING jobs on startup and periodic scans, including jobs whose controller dispatch was interrupted.
-   Recover stale PROCESSING jobs after five minutes without a heartbeat. Healthy workers refresh their heartbeat every 30 seconds. Attempt ownership checks fence obsolete workers from publishing results.
-   Link each generated scene asset to its job item at creation. Recovery can reuse a committed asset rather than calling TTS again for the same item.
-   Preserve quota cooldown timestamps without charging an attempt; retry transient network/no-audio errors with backoff and a bounded attempt count. Permanent errors remain visible and failed scenes can be retried separately.
-   Preserve historical scene/audio IDs while retiring removed or edited scene revisions. Current generation, history, ZIP, and combined WAV exports use only current scenes and valid audio matching text, delivery settings, and voice configuration.
-   Persist Single Voice requests before processing. Resume pending requests, release stale processing requests as retryable failures, and save edited draft content/title before regeneration.
-   Restore jobs from the server, including single-scene jobs and another browser's requests. Show existing audio even when no job exists in browser storage.
-   Show latest-attempt status separately from previous playable audio. Keep failure details and waiting retry times visible. Block conflicting controls and duplicate clicks.
-   Reuse the saved project when story analysis fails, avoiding duplicate projects when retrying.
-   Fit inline audio controls on mobile and delay blob-URL revocation for downloads.

No schema migration was required. Historical audio is retained; retired scene orders are negative internal history markers and are excluded from current-scene queries.

## Verification

### Real PostgreSQL and HTTP integration

31 integration tests passed against a newly created disposable PostgreSQL database, using the actual Prisma client and Nest controllers. Gemini and storage were test doubles in this suite.

Coverage includes:

-   Concurrent full-job and Single Voice creation; exactly one accepted generation.
-   Overlapping full/single-scene/retry rejection.
-   Missing voice, incomplete analysis, and ownership checks.
-   Successful jobs, partial failures, preserved scene errors, quota waiting, and bounded transient retry.
-   Pending dispatch recovery, stale-worker recovery, healthy-worker protection, and committed-audio reuse.
-   Scene retirement, voice invalidation, stale retry rejection, and previous-audio availability after failure.
-   Single Voice edited drafts, pending recovery, and interrupted processing recovery.
-   Playback bytes, missing-file/upload errors, ZIP and combined WAV output.
-   HTTP authentication/ownership errors, latest-job/history routes, full and range audio streaming, ZIP responses, and concurrent 201/409 responses.

The opt-in suite is checked in at:

`../autocanvas-api/src/audio-generation/audio-flow.integration.spec.ts`

From the backend directory, run against a disposable local database whose name ends in `_test`:

```sh
AUDIO_FLOW_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:55439/autocanvas_flow_test npx vitest run --config vitest.audio-flow.config.ts
```

The suite never falls back to the application's DATABASE_URL. Without the explicit test URL it is skipped.

### Browser

14 checks passed on the actual Next.js app in isolated Chrome with synthetic API responses:

-   Saved-audio rendering without browser job state.
-   Audio decoding and playback.
-   Failed regeneration with previous audio retained and correct attempt summary.
-   One retry/create request on double click.
-   Conflicting row controls disabled during an active job.
-   Waiting-job restoration after tab navigation.
-   Status-service failure and recovery.
-   Mobile 393×852 and desktop 1440×900 viewport containment.
-   Single Voice create/double-click prevention and edited-title/script request payloads.
-   Failed story analysis reuses its saved project.

### Live provider and builds

-   One short Hindi sentence was generated using the configured Gemini key and the repository's current TTS model.
-   The returned 140,204-byte WAV passed PCM/WAV validation and decoded/played in Chrome.
-   The sample is `/private/tmp/autocanvas-live-smoke.wav`.
-   Frontend production build passed, including type checking and all 27 generated pages.
-   Backend production TypeScript compilation passed to a temporary output directory.
-   Frontend/backend diff whitespace checks passed.

## Operational notes

Ship the frontend and backend changes together: the frontend now uses `GET /audio-generation/stories/:storyId/jobs/latest` and recognizes `SINGLE_PENDING`.

Restart the backend process to load the new controllers and recovery behavior. A stale interrupted processor can take up to roughly five minutes plus the scan interval before recovery; it is not reset merely because another replica starts.

The integration suite exercised storage failures and HTTP downloads with a storage substitute. Live Supabase/local-storage deployment configuration, large production workloads, and real provider quota exhaustion were not exercised. The provider smoke test used one short request, not an entire production story.

# Audio cancellation

Active multi-scene jobs and single-voice generation now expose **Cancel generation**. The backend verifies ownership and persists cancellation. Multi-scene cancellation marks pending, processing and waiting items cancelled, retains completed audio, clears retry times, and fences late worker results. A scene whose audio committed immediately before cancellation remains completed. Completed jobs are unchanged by a late cancellation request; repeated cancellation is safe.

Single-voice cancellation keeps the previous finished narration, clears the worker attempt token and prevents late output from replacing it. Users can generate again after cancellation. Requests already sent to Gemini may still finish and incur usage; cancellation prevents further scenes/chunks and discards late results. A provider request cannot be recalled by this endpoint.

Verification: 50 PostgreSQL integration tests passed, including cancellation of pending/running/quota-wait jobs, HTTP ownership/authentication, repeated cancellation, preservation of saved audio and late-result fencing. Frontend/backend TypeScript checks and response-parser regression tests passed.
