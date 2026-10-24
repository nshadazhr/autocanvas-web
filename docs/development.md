# Local development and checks

## Setup order

Run each application's commands in its own repository. Recent project verification used Node 24; use a compatible Node version and the repository's npm lockfile. This guide describes current code, not a claim that every external provider/deployment has been tested.

1. Set up PostgreSQL and backend environment.
2. Apply backend migrations, generate Prisma client, start the API.
3. Start the web application.
4. Start the admin UI when needed; its authentication screens are still pending.

### Backend: `autocanvas-api`

```sh
npm ci
npx prisma migrate deploy --config prisma7.config.ts
npx prisma generate --config prisma7.config.ts
npm run start:dev
```

Prepare the backend `.env` before running these commands. `prisma7.config.ts` is the current custom config filename, so supply it explicitly. `migrate deploy` modifies the configured database: choose the development database deliberately; never use reset/db-push as a routine shared-database fix.

Essential configuration names (values below are placeholders only):

```dotenv
DATABASE_URL=postgresql://app:replace-locally@127.0.0.1:5432/autocanvas_dev
JWT_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret
PORT=4000
NODE_ENV=development
REQUEST_ORIGIN_PORT=http://localhost:3000
ADMIN_ORIGIN=http://localhost:3001
GEMINI_API_KEY=replace-locally
OPENAI_API_KEY=replace-locally
RESEND_API_KEY=replace-locally
STORAGE_PROVIDER=local
```

The current AppModule constructs provider clients at startup. A local-only storage setting does not remove the AI/email client configuration requirements. Do not use provider diagnostics merely as a health check: they can make real billable requests.

Feature-specific variables:

| Feature | Configuration |
| --- | --- |
| Google sign-in | Backend `GOOGLE_CLIENT_ID`, frontend `NEXT_PUBLIC_GOOGLE_CLIENT_ID`; configure the OAuth application for the actual origins. |
| OTP emails | `RESEND_API_KEY`, optional `RESEND_FROM_EMAIL`. |
| Supabase storage | `STORAGE_PROVIDER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, optional `SUPABASE_STORAGE_BUCKET` (default `autocanvas-audio`). |
| Analysis/script models | `GEMINI_MODEL`, `OPENAI_MODEL`; choose supported models for your provider account. Defaults are defined in the respective services. |
| Multi-key TTS | `GEMINI_MULTI_KEY_ENABLED`, comma-separated `GEMINI_API_KEYS`, `GEMINI_RPM_LIMIT`, `GEMINI_RPD_LIMIT`. |
| Diagnostic access | `AI_DIAGNOSTICS_USER_IDS`: explicit internal IDs; empty denies diagnostics and provider voice sync. A SUPERADMIN role does not automatically bypass this allowlist. |
| Browser origins/login limits | See backend `docs/admin-auth.md` for the complete current contract. |
| Shared AI/audio limits | See backend `docs/audio-flow.md`. |

The checked-in environment examples are incomplete/contain legacy placeholders. Read the current names above and backend docs; do not copy production secrets into examples or Git.

### User application: `autocanvas-web`

Create `.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=replace-with-your-public-google-client-id
```

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. Use the same hostname consistently in origins and URLs (for example, localhost rather than mixing it with 127.0.0.1), especially for cookies/CORS. NEXT_PUBLIC values are exposed to the browser; no database, provider or signing secrets belong there.

### Admin application: `autocanvas-admin`

```sh
npm ci
npm run dev
```

Open `http://localhost:3001`. Current page/theme support is implemented; backend admin auth integration is a separate pending UI task. First-superadmin setup is documented in backend `docs/admin-auth.md`.

## Test commands

Web:

```sh
npm run typecheck
node --test tests/audio-generation-response.test.cjs
npm run build
```

Backend:

```sh
npm run build
npx tsc --noEmit --incremental false
```

Integration suites require a **separate disposable local PostgreSQL database**. Create it, apply the backend migrations to that test database and generate the client first. Test helpers reject non-local databases and names not ending in `_test`; they do not fall back to the application's DATABASE_URL. Suites can delete their fixture/accounting data, so never point them at application data.

Example after provisioning `autocanvas_test` locally (replace connection details for your test instance):

```sh
AUDIO_FLOW_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:5432/autocanvas_test npx vitest run --config vitest.admin-auth.config.ts
AUDIO_FLOW_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:5432/autocanvas_test npx vitest run --config vitest.audio-flow.config.ts
```

Without that variable, those integration suites skip database tests; a skipped run is not evidence they passed. `npm test` is the broader repository suite and may include older scaffold tests; the focused configs describe the workflows they actually exercise.

## Common local problems

| Problem | Check |
| --- | --- |
| Frontend 404/API calls reaching Next | API base URL should usually be `http://localhost:4000`, not `3000/api`. |
| EADDRINUSE | Identify the existing process on 3000/3001/4000; stop the process you own or intentionally choose another port and update the corresponding origin/base URL. |
| Missing `.next` chunks/vendor files after build | Stop `next dev` before `next build`; both use `.next`. Restart the dev server afterward. |
| Cookie/session does not restore | Backend running? Credentials enabled? Correct browser hostname/origin? Signing secrets unchanged? Old sessions after the revocation upgrade require re-login. |
| Admin refresh returns 403 from the web app | Intentional origin separation: admin auth mutations must originate from the admin application allowlist. |
| Login returns 429 | Follow Retry-After; repeated successful attempts also count. |
| API boot says a table/column is missing | Check the selected DB and migration status before rebuilding the generated Prisma client. |
| Audio waits rather than completing | Inspect the persisted job/item status, next retry time, application usage limits and provider cooldown. Do not repeatedly create new jobs to bypass a wait. |

## Git and documentation

Commit source, migrations, lockfiles and docs. Keep real `.env` files, private keys, tokens, uploaded audio, dependencies and build output out of Git. When reproducing a bug, record route/story/job IDs and safe error/status metadata; redact credentials. Historical handoff files are context only; current README/docs and source take precedence.
