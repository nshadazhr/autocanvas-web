import { prisma } from "@platform/database";

// Bumping `tokenVersion` is the whole mechanism: config.ts's `jwt` callback
// re-checks every outstanding session's `tokenVersion` against the DB on
// every request and drops any session whose value no longer matches. This
// function is the "admin-initiated logout" / "log out everywhere" path —
// a password reset (./password-reset.ts) does the same increment inline as
// part of its own transaction instead of calling this, since it's already
// inside a `$transaction`.
export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
}
