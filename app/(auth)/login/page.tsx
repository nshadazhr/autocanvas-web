"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

const STATS = [
  { emoji: "⚡", title: "Easy to Use", subtitle: "No technical skills" },
  { emoji: "👥", title: "1500+ Creators", subtitle: "Worldwide" },
  { emoji: "▶️", title: "Create Faster", subtitle: "With AI" },
  { emoji: "📈", title: "Grow Your Channel", subtitle: "Faster" },
];

const STICKY_NOTES = [
  { text: "Big Ideas", className: "left-4 top-6 -rotate-6 bg-amber-300" },
  { text: "Better Stories", className: "right-6 top-14 rotate-3 bg-sky-300" },
  { text: "Bigger Audience", className: "left-10 bottom-8 rotate-2 bg-pink-300" },
];

// Split-screen auth layout matching the AutoCanvas reference design: a
// marketing/illustration panel on the left, and a card on the right that
// starts on a decorative "phone OTP" landing view, then switches to the
// real, functional email+password form (the only login method this
// dummy-mode build actually wires up — see packages/auth/src/config.ts's
// Credentials-only provider list) once "Email Login" is pressed.
export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [view, setView] = useState<"landing" | "email">("landing");
  const [notice, setNotice] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function showUnavailableNotice(feature: string) {
    setNotice(`${feature} isn't wired up in this preview build — use Email Login below instead.`);
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setSubmitting(false);
    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }
    window.location.href = callbackUrl;
  }

  return (
    <div className="flex min-h-screen bg-[#05050c] text-white">
      {/* Left — marketing / illustration panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-10 lg:flex">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />
        </div>

        <Link href="/" className="relative z-10 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-lg font-bold">
            A
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-lg font-bold tracking-tight">
              Auto<span className="text-indigo-400">Canvas</span>
            </span>
            <span className="text-[11px] text-slate-400">Create. Animate. Share.</span>
          </span>
        </Link>

        <div className="relative z-10 my-8 flex-1 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="relative flex h-full items-center justify-center">
            <span className="text-8xl">🧑‍💻</span>
            {STICKY_NOTES.map((note) => (
              <span
                key={note.text}
                className={`absolute rounded-md px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-lg ${note.className}`}
              >
                {note.text}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-4">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight">
            Turn Your Ideas Into{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Amazing Stories
            </span>
          </h2>
          <p className="max-w-md text-sm text-slate-400">
            All-in-one AI platform to create cartoon stories, generate characters, backgrounds, voices, thumbnails
            and videos.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-2">
            {STATS.map((stat) => (
              <div key={stat.title} className="flex items-center gap-2.5">
                <span className="text-xl">{stat.emoji}</span>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-white">{stat.title}</span>
                  <span className="text-xs text-slate-500">{stat.subtitle}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — auth card */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-lg font-bold">
              A
            </span>
            <span className="text-lg font-bold tracking-tight">
              Auto<span className="text-indigo-400">Canvas</span>
            </span>
          </Link>

          {view === "landing" ? (
            <>
              <h1 className="text-3xl font-extrabold tracking-tight">Welcome Back!</h1>
              <p className="mt-2 text-sm text-slate-400">
                Sign in to your AutoCanvas account and continue creating amazing content.
              </p>

              <div className="mt-8">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Phone Number</label>
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                  <span className="text-slate-400">📞</span>
                  <span className="text-sm text-slate-300">+91</span>
                  <span className="h-4 w-px bg-white/15" />
                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => showUnavailableNotice("Phone OTP login")}
                  className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-opacity hover:opacity-90"
                >
                  Get OTP
                </button>

                <div className="my-6 flex items-center gap-3">
                  <span className="h-px flex-1 bg-white/10" />
                  <span className="text-xs font-medium text-slate-500">OR CONTINUE WITH</span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => showUnavailableNotice("Google sign-in")}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                  >
                    <span>🔵</span> Google
                  </button>
                  <button
                    type="button"
                    onClick={() => showUnavailableNotice("Facebook sign-in")}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                  >
                    <span>🔷</span> Facebook
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setNotice(null);
                    setView("email");
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  ✉️ Email Login
                </button>

                {notice && <p className="mt-4 text-center text-xs text-amber-400">{notice}</p>}

                <p className="mt-8 text-center text-xs text-slate-500">
                  By signing in, you agree to our{" "}
                  <a href="#" className="text-slate-300 underline underline-offset-2">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-slate-300 underline underline-offset-2">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setView("landing")}
                className="mb-6 flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white"
              >
                ← Back
              </button>

              <h1 className="text-3xl font-extrabold tracking-tight">Welcome Back!</h1>
              <p className="mt-2 text-sm text-slate-400">Log in with your email and password.</p>

              <form onSubmit={handleEmailSubmit} className="mt-8 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Password</label>
                  <input
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Logging in..." : "Log in"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-400">
                No account?{" "}
                <Link href="/register" className="font-medium text-indigo-300 hover:text-indigo-200">
                  Register
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
