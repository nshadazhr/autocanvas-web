import { NextResponse } from "next/server";
import { z } from "zod";
import { DUMMY_USER } from "../../../../lib/dummy-data";

// Registration is deliberately NOT part of Auth.js's Credentials provider
// (that provider only ever *verifies* credentials, it can't sign up new
// users). This route is the actual account-creation path apps/web's
// register page posts to; Auth.js's `signIn("credentials", ...)` is called
// client-side afterward to log the new user in.
//
// DUMMY MODE: there is no real user table to insert into (see
// lib/dummy-data.ts) and `packages/auth/src/config.ts`'s Credentials
// `authorize()` already accepts any well-formed email/password — so this
// route only validates the input shape and reports success. Nothing is
// actually persisted; every "new" account is the same fixed demo user.

const registerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { name, email } = parsed.data;

  return NextResponse.json({ id: DUMMY_USER.id, email, name }, { status: 201 });
}
