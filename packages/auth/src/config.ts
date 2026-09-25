import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@platform/database";
import { verifyPassword } from "./password";

// ─────────────────────────────────────────────────────────────────────────
// REAL MODE
//
// This replaces the previous dummy-mode config (see git history / the audio
// backend's equivalent comments for the pattern) now that Postgres is
// actually reachable via @platform/database.
//
//   - `authorize()` looks up the user by email in Postgres and verifies the
//     submitted password against the bcrypt hash in `passwordHash` (see
//     ./password.ts). Deleted accounts (`deletedAt` set) and accounts with
//     no password set at all (would only happen for an OAuth-only account,
//     once an OAuth provider is added) are rejected the same as a wrong
//     password — never reveal *why* a login failed.
//   - Session strategy stays "jwt" — Auth.js's Credentials provider only
//     supports JWT sessions, not the "database" strategy, regardless of
//     whether an Adapter is configured.
//   - `PrismaAdapter` and a Google/OAuth provider are intentionally NOT
//     added yet (this phase is email+password only, by explicit choice) —
//     an Adapter only matters once there's an OAuth provider that needs
//     Account-linking storage. Re-add both together when OAuth is scoped.
//   - The `jwt` callback re-checks `tokenVersion` against the DB on every
//     request that isn't the initial sign-in. This is what makes
//     `revokeAllSessions` (./revoke.ts) and a password reset (./password-
//     reset.ts, which also bumps tokenVersion) actually terminate other
//     outstanding sessions instead of just being decorative — returning
//     `null` from this callback tells Auth.js to drop the session.
// ─────────────────────────────────────────────────────────────────────────

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
        });

        if (!user || user.deletedAt || !user.passwordHash) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email.split("@")[0],
          role: user.role,
          tokenVersion: user.tokenVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Initial sign-in: `user` is what `authorize()` returned above.
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "USER";
        token.tokenVersion = (user as { tokenVersion?: number }).tokenVersion ?? 0;
        return token;
      }

      // Every subsequent request: re-validate against the DB so a password
      // reset / admin "log out everywhere" / account deletion takes effect
      // immediately instead of waiting for the JWT to expire on its own.
      if (!token.id) return token;

      const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } });
      if (!dbUser || dbUser.deletedAt || dbUser.tokenVersion !== token.tokenVersion) {
        // Auth.js treats a null return from `jwt` as "this session is no
        // longer valid" and clears the cookie.
        return null;
      }

      token.role = dbUser.role;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "ADMIN" | "SUPER_ADMIN";
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
