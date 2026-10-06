import { NextResponse } from "next/server";
import { z } from "zod";
import { consumePasswordResetToken } from "@platform/auth";

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const result = await consumePasswordResetToken(parsed.data.token, parsed.data.password);

  if (!result.ok) {
    const messages: Record<typeof result.reason, string> = {
      invalid: "This reset link is invalid.",
      expired: "This reset link has expired. Please request a new one.",
      "already-used": "This reset link has already been used.",
    };
    return NextResponse.json({ error: messages[result.reason] }, { status: 400 });
  }

  return NextResponse.json({ message: "Password updated. You can now log in." });
}
