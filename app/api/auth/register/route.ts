import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@platform/database";
import { hashPassword } from "@platform/auth";

// Registration is deliberately NOT part of Auth.js's Credentials provider
// (that provider only ever *verifies* credentials, it can't sign up new
// users). This route is the actual account-creation path apps/web's
// register page posts to; Auth.js's `signIn("credentials", ...)` is called
// client-side afterward to log the new user in.

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
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Deliberately vague — do not reveal whether an email is registered.
    return NextResponse.json(
      { error: "Could not create account with the provided details." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);

  const freePlan = await prisma.subscriptionPlan.findUnique({ where: { key: "free" } });
  if (!freePlan) {
    // Should never happen post-seed; fail loudly rather than silently
    // creating a user with no plan/credits.
    return NextResponse.json(
      { error: "Signup is temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }

  // Atomic: a user must never exist without a credit account, and a credit
  // account must never exist without its opening GRANT transaction recorded
  // in the ledger (see packages/credits, Chunk 3, for the reserve/consume/
  // refund side of this same ledger).
  const user = await prisma.$transaction(async (tx: typeof prisma) => {
    const created = await tx.user.create({
      data: { name, email, passwordHash },
    });

    const creditAccount = await tx.creditAccount.create({
      data: {
        userId: created.id,
        balance: freePlan.monthlyCredits,
        reserved: 0,
      },
    });

    await tx.creditTransaction.create({
      data: {
        creditAccountId: creditAccount.id,
        type: "GRANT",
        amount: freePlan.monthlyCredits,
        referenceType: "subscription_plan",
        referenceId: freePlan.id,
        balanceAfter: freePlan.monthlyCredits,
      },
    });

    await tx.subscription.create({
      data: {
        userId: created.id,
        planId: freePlan.id,
        provider: "NONE",
        status: "ACTIVE",
      },
    });

    return created;
  });

  return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
}
