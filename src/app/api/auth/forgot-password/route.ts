import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@platform/database";
import { createPasswordResetToken } from "@platform/auth";
import { sendEmail, passwordResetEmail } from "../../../../lib/email";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return the same generic success response whether or not the
  // account exists — otherwise this endpoint becomes a way to check which
  // emails have an AutoCanvas account (user enumeration).
  const genericResponse = NextResponse.json({
    message: "If an account exists for that email, a reset link has been sent.",
  });

  if (!user || user.deletedAt || !user.passwordHash) {
    return genericResponse;
  }

  const rawToken = await createPasswordResetToken(user.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

  await sendEmail({ to: user.email, ...passwordResetEmail(resetUrl) });

  return genericResponse;
}
