# AutoCanvas Audio Studio — Frontend Handoff

## 1. Project Context

Main AutoCanvas naam ka web application develop kar raha hoon.

- Frontend: Next.js 14, TypeScript, Tailwind CSS
- Backend: NestJS
- Database: PostgreSQL + Prisma 7
- Authentication: Access token + HttpOnly refresh-token cookie
- Audio generation: Google Gemini TTS
- Frontend API calls: Axios

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

- Audio Stories list with search and status filtering
- Story creation and detail page
- Script editing
- Story analysis API integration
- Character/cast UI
- Real backend voices API
- Cast assignment and save API
- Analyzed scenes display
- Generate Audio tab ka basic UI

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

- Story ID: 2
- Original job ID: 2 — PARTIAL, scene 1 completed
- Retry job ID: 5 — COMPLETED, scene 2 completed
- Dono scenes ki WAV files generate ho chuki hain.

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

- Ek time par ek step implement karna.
- Existing code pehle read karna.
- Unnecessary refactoring nahi.
- Existing Prisma schema change nahi.
- Hardcoded mock voice list nahi.
- Existing reusable components reuse karna.
- Local script parser enabled rehna chahiye.
- Gemini-based AI analysis abhi global feature flag se disabled hai; Gemini TTS generation alag functionality hai.
- Existing authentication/refresh-token logic preserve karna.
- Exact existing variables aur function names inspect karne ke baad code suggest karna.
- Backend generation already tested hai; unnecessary Gemini calls mat karwana.
- Roman Hindi me explain karna: kya kar rahe hain, kyun, aur kis file me.

## 8. Where to Resume

**Next step:** Uploaded frontend ZIP inspect karke `src/app/(app)/audio/stories/[storyId]/page.tsx` ke existing Generate Audio tab me API integration start karo.

Sabse pehle current code ka review karo. Phir minimum required files aur changes batao.

Mujhe pura frontend dobara nahi banana. Existing AutoCanvas Audio Studio ko wahi se continue karna hai jahan previous chat me chhoda tha.

---

# UPDATE — 16 October 2026: Latest Audio Studio + Animation Studio Plan

> **Read this section first when resuming.** Sections 1–8 above are a historical handoff snapshot. In particular, the old “Generate Audio tab is placeholder” and “Where to Resume” statements describe an earlier stage and must **not** be treated as the latest implementation status. Verify the current uploaded source before claiming a feature works.

## 9. Audio Studio — newer implemented work (reported in later development)

- Character Voices story-based flow advanced beyond the historical placeholder: script analysis (local parser), cast/voice assignments, scene-wise generation, status/progress, audio playback/download, and failed-scene retry have been worked on. Preserve existing Character Voices behavior and verify current code rather than rebuilding it.
- Audio Studio UI includes a project dashboard, `/audio/create`, and story-specific screens. `/audio/create` offers **One Voice** and **Character Voices** modes.
- **One Voice / Single Voice** flow was added: selecting One Voice immediately reveals voice selection and Generate Audio/Play/Download UI on the **same Create Audio page**, without an extra Continue step. Project is created/saved when Generate is triggered; saved projects should reopen.
- Single Voice UI design: compact desktop layout, internally scrolling voice list, visible generate/playback controls, normal scrolling on small screens. Use real backend voice API; no hardcoded voices.
- Character Voices selection must retain its larger script editor and original Analyze Script workflow. Single Voice compact styles must not alter Character Voices layout.
- Fixed a recent script-editor styling regression: textarea explicitly uses dark background `bg-[#1b1b23]`, light text, muted placeholder, subtle border and focus border. Its sizing depends on `voiceMode` (`single` compact; Character Voices taller). User confirmed the fix.
- Other previously agreed Audio Studio requirements: compact searchable/filterable scene list for large stories; generation job summary/progress; scene-specific regenerate/retry; Regenerate All and Retry All Failed; custom confirmation modal for regeneration, toasts for status, hidden 24-hour Trash for successfully replaced WAVs, preserve existing audio on regeneration failure; optional infinite scroll/pagination scene navigation. **Verify which of these are actually implemented** before marking them complete.

### Single Voice review — known deferred risks (not release-blocking yet)

A prior review identified potential issues requiring verification against the latest code:

1. Duplicate project creation after failure/reload.
2. Generation stuck in `SINGLE_PROCESSING` after server restart (background task recovery).
3. Long-script chunk failure and retry resilience.
4. Saved script editing/update versus regeneration behavior.
5. WAV duration calculation from fixed offsets may be unreliable with nonstandard headers.

**Decision:** Release is not imminent; fixes are deferred. Do not change these areas without a new request. Preserve existing working features.

### Useful current-code paths to inspect

- `src/app/(app)/audio/create/page.tsx`
- `src/app/(app)/audio/single-voice-studio.tsx`
- `src/app/(app)/audio/stories/[storyId]/page.tsx`
- Frontend Single Voice API module (locate exact path in current source).
- Backend `single-voice.service.ts`, `single-voice.controller.ts`, and existing Character Voices generation services.

## 10. Animation Studio — NEW project direction (planning approved, implementation pending)

**Goal:** Full 2D cartoon Animation Studio for scene composition, rigging, keyframes, reusable motions, Audio Studio sync, and MP4 export. Build incrementally and **do not break Audio Studio**.

**Technology direction:** Next.js/React/TypeScript UI; PixiJS canvas; custom deterministic rigging/keyframe engine; NestJS APIs; Prisma/PostgreSQL metadata; external file/object storage for assets; FFmpeg-based export later. Keep animation playback tied to timeline time/frame, not ad hoc animations.

### Milestone 1 — Foundation + Usable Scene Editor (FIRST implementation target)

- Dashboard: list/create/open/delete animation projects.
- Project settings: name, resolution (default 1920x1080 / 16:9), FPS.
- Scenes: add, rename, duplicate, delete, reorder.
- Dark editor shell with asset library, central PixiJS stage, properties inspector, scenes/layers panels.
- Canvas zoom/pan; asset import PNG/JPG/WebP, including transparent character images; categorize characters/backgrounds/props.
- Place/select/move/scale/rotate/flip objects; edit position, size, rotation, opacity.
- Layer order, visibility and lock; undo/redo; real API save/load and reopen.

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

- Separate character artwork, reusable rig templates, animation clips, and scene instances.
- Use real API data and reusable components; no premature schema redesign.
- Preserve originals (non-destructive assets); provide undoable editing commands.
- Keep rendering engine state separate from React UI rendering.
- Validate future export feasibility early, even though rendering is Milestone 7.
- The **body-part PNG vs layered PSD/SVG primary import strategy remains undecided**; do not assume PSD/SVG support in Milestone 1.

## 11. Next action / handoff instructions (supersedes historical Section 8)

1. Start **Animation Studio Milestone 1, Step 1** only after inspecting the latest complete frontend/backend code uploaded by the user.
2. Implement incrementally, preserve the current Audio Studio, and avoid touching Character Voices/Single Voice logic unless strictly necessary.
3. Provide only changed files in ZIP archives, preserving source folder paths; explain what changed and what was actually tested.
4. Do not mark Animation Studio features implemented until corresponding code is delivered and verified. **As of this handoff, Animation Studio remains planned, not implemented.**
5. Maintain the separate detailed plan `AutoCanvas_Animation_Studio_Milestones.md` alongside this frontend handoff.
