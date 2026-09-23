import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// ─────────────────────────────────────────────────────────────────────────
// DUMMY MODE
//
// This is a standalone preview build with no Postgres and no apps/backend
// running (see lib/dummy-data.ts for the full explanation). The real config
// this file replaces used `PrismaAdapter(prisma)` for Account/User/Session
// persistence and a Google provider, re-checked `User.tokenVersion` against
// the DB on every request for session revocation, and verified the
// Credentials provider's password against a bcrypt hash stored in Postgres.
// None of that is available here, so:
//
//   - No adapter at all — nothing needs to persist across a login; the JWT
//     session cookie alone is enough for a single-account preview.
//   - No Google provider — it would need real AUTH_GOOGLE_ID/SECRET values
//     and a redirect target that isn't relevant to a dummy-data preview.
//   - Credentials `authorize()` accepts ANY non-empty email + password
//     (min 8 chars, matching the register page's own validation) and signs
//     into the one fixed account in `lib/dummy-data.ts` — there is no real
//     password check because there is no real user database to check it
//     against.
//   - The `jwt` callback no longer re-reads the DB on every request, so
//     there is no server-side session revocation in this build — sessions
//     just expire when the JWT does.
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
        if (!email || !password || password.length < 8) return null;

        // Dummy mode: any credentials that pass basic validation log into
        // the same fixed demo account, using whatever email was typed in
        // as the display email — there's no real account lookup here.
        return {
          id: "dummy-user-1",
          email,
          name: email.split("@")[0],
          role: "USER" as const,
          tokenVersion: 0,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "USER";
        token.tokenVersion = (user as { tokenVersion?: number }).tokenVersion ?? 0;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "ADMIN" | "SUPER_ADMIN";
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
