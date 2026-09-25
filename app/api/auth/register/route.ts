import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@platform/database";
import { hashPassword } from "@platform/auth";
import { grantCredits } from "@platform/credits";

// Registration is deliberately NOT part of Auth.js's Credentials provider
// (that provider only ever *verifies* credentials, it can't sign up new
// users). This route is the actual account-creation path apps/web's
// register page posts to; Auth.js's `signIn("credentials", ...)` is called
// client-side afterward to log the new user in.
//
// Real mode: creates the User row for real (bcrypt hash via hashPassword,
// see packages/auth/src/password.ts) and gives it a CreditAccount with a
// signup bonus so a brand-new account can try Audio Studio immediately
// instead of hitting "No credit account found" on its first generation —
// same number dummy mode's preview balance showed, so the free experience
// doesn't feel like a downgrade once this is pointed at real infra.
const SIGNUP_BONUS_CREDITS = 2450n;

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
  const { name, email: rawEmail, password } = parsed.data;
  const email = rawEmail.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Deliberately vague — don't confirm to an anonymous caller that a
    // specific email already has an account.
    return NextResponse.json(
      { error: "Could not create account with these details." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: "USER",
    },
  });

  const creditAccount = await prisma.creditAccount.create({
    data: { userId: user.id, balance: 0, reserved: 0 },
  });
  await grantCredits(creditAccount.id, SIGNUP_BONUS_CREDITS, { type: "GRANT" });

  return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
}
