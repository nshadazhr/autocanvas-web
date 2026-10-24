# AutoCanvas Web

User-facing Next.js application. Current Audio Studio and animation clients call the separate NestJS backend; some other screens still use demo data.

## Start here

| Document | Kab padhein |
| --- | --- |
| [Architecture](docs/architecture.md) | Teen repositories aur main modules ka relation samajhna ho. |
| [Local development](docs/development.md) | Setup, environment, ports, test commands ya local errors debug karne hon. |
| [Frontend guide](docs/frontend-guide.md) | Routes, API calls, auth state ya Audio Studio UI change karni ho. |

Backend-specific auth, audio, storage and operations docs live in the **autocanvas-api** repository. The **autocanvas-admin** README describes the current admin UI status.

## Quick start

Run from this repository, with dependencies installed and the backend running on port 4000:

```sh
npm ci
```

Create a local `.env.local` file (never commit it):

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=replace-with-your-public-google-client-id
```

```sh
npm run dev
```

Open `http://localhost:3000`. The API base URL has **no `/api` suffix** for the current Nest routes. The checked-in `.env.example` contains older placeholders; use the current route/config documentation before copying values.

## Checks

```sh
npm run typecheck
node --test tests/audio-generation-response.test.cjs
npm run build
```

Stop the development server before building: both commands write `.next`. Restart it after the build. Do not commit `.next`, `node_modules`, real tokens or environment secrets.

## Documentation policy

Code and current configuration are authoritative. Update the corresponding doc when changing a route, environment name, job state, storage key or permission. [The older handoff](AutoCanvas_Frontend_Handoff.md) is historical context, not the current API contract. Record planned work as pending rather than documenting it as implemented.
