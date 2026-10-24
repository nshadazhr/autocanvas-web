# Frontend maintenance guide

## Current routes and responsibilities

| UI | Entry point |
| --- | --- |
| User auth | `src/app/(auth)/`, `src/providers/AuthProvider.tsx` |
| App sidebar/header/layout | `src/components/layout/`, `src/app/(app)/layout.tsx` |
| Audio projects list/create | `src/app/(app)/audio/page.tsx`, `audio/create/page.tsx` |
| Story script/scenes/audio tabs | `src/app/(app)/audio/stories/[storyId]/page.tsx` |
| Analyzed scene/cast management | `src/app/(app)/audio/stories/[storyId]/scenes-panel.tsx` |
| Generation actions, polling and job summary | `src/app/(app)/audio/audio-generation/audio-generation-panel.tsx` |
| Scene rows, filters, paging and downloads | `src/app/(app)/audio/audio-generation/components/generation-scenes-table.tsx` |
| Single narration | `src/app/(app)/audio/single-voice-studio.tsx` |
| Animation editor | `src/app/(workspace)/animation/[projectId]/page.tsx` |

## API layer: reuse this first

`src/app/api/axios.ts` provides the base URL, credentials, bearer token and retry-after-refresh behavior. Domain clients live in `src/app/api/auth/`, `audio-studio/` and `animation/`. Prefer those clients over direct fetch/Axios calls scattered through components.

`src/lib/api-error.ts` converts backend validation/error responses into UI messages. Keep runtime response checks at the API boundary where needed; TypeScript types do not validate HTTP bodies.

### Session flow

`auth-token.ts` keeps the user access token in memory. `AuthProvider` uses the HttpOnly-cookie refresh endpoint to restore it on reload, then fetches the profile. `auth-refresh.ts` shares one pending refresh promise so concurrent 401s do not launch duplicate refresh requests. Logout clears local state after the backend revokes the current session.

`ProtectedRoute` protects the user experience, but API guards enforce actual access. Admin tokens/cookies/origins are separate; do not reuse the user Axios/refresh flow unchanged for the admin project. See the backend auth documentation for that contract.

## Audio UI rules

- Story analysis and audio generation are different jobs. Show queued/processing/waiting analysis state without pretending audio has started.
- Restore the latest audio job and full story audio history from the backend. The current job may contain only one scene or failed scenes; it is not the authoritative list of all scene rows.
- An empty latest-job response can be an empty string, not just JSON null. `audio-generation-response.ts` normalizes no-job responses and rejects incomplete job details before components render.
- Show Generate for a new scene, Retry for an interrupted/failed attempt without audio, and Regenerate when current audio exists. Queued/Generating/Waiting states have disabled action labels. Use the corresponding confirmation wording.
- Multi-scene polling currently refreshes status/history every three seconds while the panel is mounted. This is polling, not WebSocket streaming; repeated successful network requests are expected.
- Cancellation keeps previously saved audio. An already-sent provider request can still cost usage; late results must not appear as a resumed cancelled job.
- Voice filtering uses assigned voice (including scene override) before audio exists. Do not derive the voice list solely from completed audio.
- Use the backend `downloadFilename` for per-scene downloads. Keep generated file paths and human-readable download names separate.
- Failed regeneration must remain visible even if previous audio is playable. Do not replace failure status with COMPLETED just because an old file exists.

Mutation refs prevent duplicate clicks; request epochs prevent stale polling responses from overwriting newer state. Keep these protections when refactoring. Single-voice polling also avoids overwriting cancellation with an older response.

## Layout and playback

New and changed UI must support mobile, tablet and desktop. Check a narrow phone
viewport around 360–393px as well as wider layouts. Controls, text, forms and
dialogs must remain accessible without page-level horizontal overflow; wide
tables may scroll inside a bounded container. Do not conceal inaccessible
content with overflow hiding. Report any viewport checks not performed.

The shell and editor use a bounded flex layout (`min-h-0`, `min-w-0`) with internal scroll areas. Preserve scroll ownership when adding banners/toolbars; avoid nested minimum heights that force whole-screen or horizontal scrolling. Check a narrow mobile viewport and a desktop viewport.

Audio players/downloads fetch authorized blobs through API clients. Revoke object URLs after use. Preserve playback/range behavior on the backend when changing the UI; do not construct public storage URLs from guessed keys.

## Demo and older code

The app shell still reads plan/credit values from `src/lib/dummy-data.ts`. Several product pages are UI/demo work. `audio/actions.ts` and `src/lib/backend-client.ts` belong to an older server-action bridge; the latter has incomplete/commented HTTP plumbing. Current Audio Studio uses the dedicated API clients. Do not treat legacy comments or the existence of a screen as proof of a working backend feature.

Feature flags in `src/lib/feature-flags.data.json` are local configuration, not a connected admin settings system.

## When changing UI

### Shared strings, settings and styling

Repository instructions in [AGENTS.md](../AGENTS.md) require checking documentation
after code changes and incrementally removing relevant hardcoding in affected
code. This does not require an unrelated whole-project rewrite.
Migration happens only when the user requests a change to that page, and only
for its affected code. Other pages remain outside the migration scope. Shared
strings, settings or components may be updated to support the requested page
while preserving existing consumers.

- Copy defaults live in `src/appDefaults/localStrings.ts`. Use `getStrings()` for
  server code and `useStrings()` for client code. The resolver flattens groups,
  so keys must be unique across groups. Remote nonblank strings can override
  defaults when explicitly supplied to the resolver.
- Product defaults live in `src/appDefaults/localAppSettings.ts`. Use
  `getAppSettings()` or `useAppSettings()` instead of bypassing the resolver.
  The resolver accepts same-type overrides, including `false` and `0`. Keep
  deployment URLs in environment configuration and security enforcement on the
  backend.
- Shared UI primitives live in `src/components/ui/`; check their variants before
  copying styles. Reuse dashboard/shell visual conventions. Shared CSS belongs
  in `src/app/globals.css`, with Tailwind theme extension in
  `tailwind.config.ts` when actual reusable tokens are needed. Feature-specific
  layout utilities can remain local.

Current gaps: dashboard/auth/common string groups are empty, and many dashboard
and auth labels remain inline. Login reads feature defaults directly. The
Tailwind theme has no custom tokens, and some shared primitives default to a
light appearance, so choose variants deliberately for dark screens. The
strings/settings hooks currently resolve local defaults; their override support
does not mean live admin configuration is connected. These are migration gaps,
not features already implemented by the documentation rules.

Read [development.md](development.md) for commands. Verify no-job, fresh generation, processing, quota wait, failure with old audio, cancellation and reload/tab restoration for an audio change. For API-shape changes update the client type/decoder with the backend response. For purely visual copy changes, use the smallest relevant type/browser check; do not rerun paid provider calls by default.
