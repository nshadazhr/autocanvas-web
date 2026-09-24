import crypto from "crypto";
import { prisma } from "@platform/database";
import { hashPassword } from "./password";

// ─────────────────────────────────────────────────────────────────────────
// Forgot-password flow.
//
// The raw token goes in the emailed link; only its SHA-256 hash is ever
// written to Postgres (see schema.prisma's PasswordResetToken comment) —
// this is the same "never store the usable secret" principle as bcrypt
// password hashing, just with a fast hash since the token itself already
// has 256 bits of entropy (no brute-force risk the way a short password
// would have).
// ─────────────────────────────────────────────────────────────────────────

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// Hand-typed structural subset of the transaction client this function
// actually calls — same reason @platform/credits/ledger.ts's LedgerTxClient
// exists: this sandbox's generated Prisma client is a stale/minimal build
// (no network access to regenerate — see the audio backend's equivalent
// comments), so `prisma.$transaction`'s own inferred callback type isn't
// reliable to depend on. Any real PrismaClient transaction callback
// satisfies this automatically.
interface PasswordResetTxClient {
  passwordResetToken: {
    findUnique(args: { where: { tokenHash: string } }): Promise<{
      id: string;
      userId: string;
      usedAt: Date | null;
      expiresAt: Date;
    } | null>;
    update(args: { where: { id: string }; data: { usedAt: Date } }): Promise<unknown>;
  };
  user: {
    update(args: {
      where: { id: string };
      data: { passwordHash: string; tokenVersion: { increment: number } };
    }): Promise<unknown>;
  };
}

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Issues a new reset token for a user and returns the RAW token (only
 * callers that are about to email it should ever see this value — never
 * log it, never return it from an API response).
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const rawToken = crypto.randomBytes(TOKEN_BYTES).toString("hex");

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  return rawToken;
}

export type ConsumeResetTokenResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "expired" | "already-used" };

/**
 * Validates a raw token from a reset link, sets the new password, bumps
 * `tokenVersion` (so every other logged-in session for this account is
 * invalidated — the same mechanism `revokeAllSessions` uses), and marks the
 * token used. All in one transaction so a token can never be spent twice
 * even under concurrent requests.
 */
export async function consumePasswordResetToken(
  rawToken: string,
  newPassword: string,
): Promise<ConsumeResetTokenResult> {
  const tokenHash = hashToken(rawToken);
  const newPasswordHash = await hashPassword(newPassword);

  return prisma.$transaction(async (tx: PasswordResetTxClient) => {
    const record = await tx.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record) {
      return { ok: false, reason: "invalid" as const };
    }
    if (record.usedAt) {
      return { ok: false, reason: "already-used" as const };
    }
    if (record.expiresAt.getTime() < Date.now()) {
      return { ok: false, reason: "expired" as const };
    }

    await tx.user.update({
      where: { id: record.userId },
      data: {
        passwordHash: newPasswordHash,
        tokenVersion: { increment: 1 },
      },
    });
    await tx.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    return { ok: true };
  });
}
