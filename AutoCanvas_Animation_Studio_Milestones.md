# AutoCanvas — Animation Studio Implementation Milestones

**Status:** Planning approved; implementation not yet started.
**Goal:** Full 2D cartoon animation editor integrated with existing AutoCanvas, without breaking Audio Studio.
**Stack direction:** Next.js/React/TypeScript, PixiJS, NestJS, Prisma/PostgreSQL, file/object storage; later deterministic animation engine and FFmpeg export.

## Milestone 1 — Foundation + Usable Scene Editor

**Scope:**

- Animation dashboard: list, create, open, delete projects.
- Project settings: name, canvas resolution (default 1920×1080 / 16:9), FPS.
- Scenes: add, rename, duplicate, delete, reorder.
- Dark editor shell with assets, canvas, inspector, scenes/layers; responsive/resizable where practical.
- PixiJS canvas: zoom, pan, select.
- Import PNG (including transparency), JPG, WebP; organize as characters/backgrounds/props.
- Place, drag, scale, rotate, flip objects; edit X/Y, dimensions, rotation, opacity.
- Layers: visibility, lock, reorder.
- Undo/redo; save/load through real APIs and persistent storage.
- Reopen saved projects with scene and object transforms intact.

**Implementation steps:**

1. Dashboard + project APIs + scene CRUD + editor layout.
2. PixiJS stage + asset upload/library + object manipulation + layers.
3. Undo/redo + persistence + reopen + regression checks.

**Acceptance criteria:** A user can create a project, add scenes, import a background and character, arrange objects on a 16:9 stage, save, reload and see the same result. Existing Audio Studio works unchanged.

## Milestone 2 — Rigging Editor

- Assemble characters from transparent body-part images.
- Bone hierarchy, joints, pivots, default/rest pose, parent-child transforms.
- Attach body parts to bones; rig templates; save/load.
- Keep character artwork, rig definition, and scene instances separate.
- Validate compatibility for rig reuse across characters.

## Milestone 3 — Timeline + Keyframe Animation

- FPS-based timeline, play/pause/seek, tracks and keyframes.
- Position, rotation, scale, opacity, bone pose animation.
- Interpolation/easing; reusable animation clips; deterministic playback.
- Save and reopen animations.

## Milestone 4 — Reusable Motion Library

- Idle, walk, run, talk, wave, sit presets.
- Reuse clips on compatible rigs; retargeting where needed.
- Pose and clip library; compatibility feedback.

## Milestone 5 — Audio Studio Integration + Lip Sync

- Import/reference existing generated WAV audio without modifying Audio Studio.
- Narration and character dialogue tracks; speaker-to-character mapping.
- Manual mouth poses and basic automatic lip-sync; improve viseme alignment later.

## Milestone 6 — Advanced Character Controls

- IK, constraints, facial expressions, optional mesh deformation.
- Animation blending and enhanced rig/pose controls.

## Milestone 7 — Render + Export

- Deterministic frame rendering; audio mix; FFmpeg MP4 output.
- Render jobs, status/progress, download and failure handling.
- Validate export feasibility early during foundation design.

## Milestone 8 — Stability + Performance

- Autosave/recovery, migration/versioned JSON, large-scene optimization.
- Validation, browser testing, export fidelity, regression testing.

## Architectural guardrails

- Do not change working Audio Studio/Character Voices flows unnecessarily.
- No hardcoded fake API data in production features.
- Reusable components; separate editor engine from React UI state.
- Non-destructive assets; versioned project data; undoable editor actions.
- Same timestamp/frame must produce the same visual state.
- Keep character artwork, rig templates, animation clips, and scene objects distinct.

## Next action

Receive the user's **latest existing milestone/planning file** and update it to reflect the agreed Animation Studio plan, preserving its existing content and structure where possible. For implementation, request current complete frontend and backend code archives before editing.
