import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@platform/auth";
import { LinkButton } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

const FEATURES = [
  {
    title: "Audio Studio",
    description:
      "Turn a script into narrated audio — import scenes from a CSV or write them by hand, generate with your choice of voice, then export a single merged file or per-scene clips.",
  },
  {
    title: "Pay-as-you-grow credits",
    description:
      "Every generation draws from a simple shared credit balance. Start on a free allowance, upgrade to a paid plan by card or Razorpay when you need more.",
  },
  {
    title: "Built to grow",
    description:
      "Audio Studio is the first tool on a platform designed for more AI-powered creation tools to plug into the same account, credits, and billing.",
  },
];

export default async function HomePage() {
  const session = await auth();
  // Middleware already sends a logged-in visit of "/" straight to
  // /dashboard (see middleware.ts's PUBLIC_PATHS handling) — this is a
  // defensive backstop in case that ever changes, same reasoning as the
  // `if (!session?.user) return null;` guards on the other app pages.
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <span className="text-sm font-semibold tracking-tight text-slate-900">AI Creator</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Log in
            </Link>
            <LinkButton href="/register" size="sm">
              Get started
            </LinkButton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="flex flex-col items-start gap-6 py-20">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Turn scripts into studio-quality audio in minutes.
          </h1>
          <p className="max-w-xl text-lg text-slate-600">
            AI Creator is a credit-based platform for AI-powered content creation. Audio Studio is live today — write
            or import your script, generate narration, and export a finished file.
          </p>
          <div className="flex items-center gap-3">
            <LinkButton href="/register">Get started free →</LinkButton>
            <LinkButton href="/login" variant="secondary">
              Log in
            </LinkButton>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 pb-24 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
