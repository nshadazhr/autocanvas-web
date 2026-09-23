import { handlers } from "@platform/auth";

// Delegates entirely to the shared Auth.js config in packages/auth — this
// file's only job is to exist at the route path Auth.js expects. apps/admin
// will get an identical one-liner when it's scaffolded.
export const { GET, POST } = handlers;
