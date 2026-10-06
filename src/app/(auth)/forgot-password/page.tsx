"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = await res.json().catch(() => ({}));

    setSubmitting(false);
    setMessage(body.message ?? "If an account exists for that email, a reset link has been sent.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05050c] px-6 py-12 text-white">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-lg font-bold">
            A
          </span>
          <span className="text-lg font-bold tracking-tight">
            Auto<span className="text-indigo-400">Canvas</span>
          </span>
        </Link>

        <h1 className="text-3xl font-extrabold tracking-tight">Forgot password?</h1>
        <p className="mt-2 text-sm text-slate-400">
          Enter your account email and we&apos;ll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
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

          {message && <p className="text-sm text-slate-300">{message}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          <Link href="/login" className="font-medium text-indigo-300 hover:text-indigo-200">
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
