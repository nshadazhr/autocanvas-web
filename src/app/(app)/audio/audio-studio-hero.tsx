"use client";

import { useState } from "react";
import Link from "next/link";
import { CreateProjectModal } from "./create-project-modal";

// Everything on this page that either opens the "Create New Audio Project"
// modal or needs client state lives here — the rest of /audio (Recent
// Projects table, Usage Overview, Popular Voices, Pro Tip) stays a plain
// server component in page.tsx since it's static/read-only per request.
//
// "Manage Voices" / "Voice Editor" / "My Voices" don't have a real feature
// yet in this preview, so they still route to the /voices "coming soon"
// page instead of opening the modal.
const MODAL_QUICK_ACTIONS = [
  { icon: "📥", label: "Import Story", sub: "CSV or paste a script" },
  { icon: "🎵", label: "Generate Audio", sub: "Turn scenes into speech" },
  { icon: "🔊", label: "Merge Audio", sub: "Combine scenes into one file" },
];

const LINK_QUICK_ACTIONS = [
  { href: "/voices", icon: "🎚️", label: "Manage Voices", sub: "Assign character voices" },
  { href: "/voices", icon: "🎙️", label: "Voice Editor", sub: "Fine-tune style & emotion" },
  { href: "/voices", icon: "⭐", label: "My Voices", sub: "Your saved voice presets" },
];

export function AudioStudioHero() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600/20 via-indigo-500/10 to-transparent px-8 py-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">Audio Studio</p>
        <h1 className="mt-2 max-w-lg text-3xl font-bold text-white sm:text-4xl">
          Turn Your Stories into{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
            Realistic Voices
          </span>
        </h1>
        <p className="mt-3 max-w-md text-sm text-slate-400">
          Generate high-quality AI narration for your stories, with emotions, multiple characters, and
          natural-sounding narration.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-opacity hover:opacity-90"
          >
            + Create New Project
          </button>
          <span
            className="cursor-not-allowed rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-400"
            title="Demo only — no walkthrough video in this preview"
          >
            ▶ Watch Tutorial
          </span>
        </div>
        <span className="pointer-events-none absolute -right-6 -top-6 text-[120px] opacity-10 sm:text-[160px]">
          🎧
        </span>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MODAL_QUICK_ACTIONS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-colors hover:bg-white/[0.06]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-lg">
                {item.icon}
              </span>
              <span className="text-sm font-medium text-white">{item.label}</span>
              <span className="text-xs text-slate-500">{item.sub}</span>
            </button>
          ))}
          {LINK_QUICK_ACTIONS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-lg">
                {item.icon}
              </span>
              <span className="text-sm font-medium text-white">{item.label}</span>
              <span className="text-xs text-slate-500">{item.sub}</span>
            </Link>
          ))}
        </div>
      </div>

      <CreateProjectModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
