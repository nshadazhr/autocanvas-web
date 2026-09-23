// ─────────────────────────────────────────────────────────────────────────
// DUMMY MODE — no real user database to bump `tokenVersion` in (see
// lib/dummy-data.ts and config.ts). Nothing in this app currently calls
// `revokeAllSessions` (it existed for a future admin "log out everywhere"
// action), but it's re-exported from `index.ts`, and a barrel re-export
// still evaluates this module on import — so it must not reach for
// `@platform/database` even though it's dead code today.
// ─────────────────────────────────────────────────────────────────────────

export async function revokeAllSessions(_userId: string): Promise<void> {
  // No-op in dummy mode: sessions are plain JWTs with nothing durable to
  // revoke server-side. See config.ts for the full explanation.
}
