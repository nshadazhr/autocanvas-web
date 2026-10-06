"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { createAudioProject, type ActionResult } from "./actions";
import { SubmitButton, ErrorText } from "./action-forms";

// Illustrative voice list — dummy mode has no real voice catalog/TTS engine
// yet, so picking a voice here doesn't change how audio actually generates.
// It IS saved on the project (see lib/dummy-data.ts) and shown back on the
// project detail page, so it isn't just thrown away either.
const VOICES = [
  { value: "zephyre", label: "Zephyre — Bright, Female", icon: "🎤" },
  { value: "ava", label: "Ava — Warm, Female", icon: "🗣️" },
  { value: "ethan", label: "Ethan — Deep & calm, Male", icon: "🎙️" },
  { value: "maya", label: "Maya — Energetic, Female", icon: "🎧" },
  { value: "leo", label: "Leo — Storyteller, Male", icon: "📖" },
];

const LANGUAGES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "hi-IN", label: "Hindi (India)" },
  { value: "es-ES", label: "Spanish (Spain)" },
  { value: "fr-FR", label: "French (France)" },
  { value: "de-DE", label: "German (Germany)" },
  { value: "ja-JP", label: "Japanese" },
];

export function CreateProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, formAction] = useFormState<ActionResult<{ audioProjectId: string }> | null, FormData>(
    createAudioProject,
    null,
  );
  const [method, setMethod] = useState<"paste" | "csv">("paste");

  // Reset to a clean first-tab state every time the modal is (re)opened.
  useEffect(() => {
    if (open) setMethod("paste");
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#10131f] p-8 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-2xl">
              🎵
            </span>
            <div>
              <h1 className="text-xl font-bold text-white">Create New Audio Project</h1>
              <p className="text-sm text-slate-400">Turn your story into narrated audio in minutes.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form action={formAction} className="contents">
          {/* Project Name */}
          <div className="mt-7">
            <label className="text-sm font-semibold text-white">Project Name</label>
            <p className="mt-0.5 text-xs text-slate-500">Give your project a name so you can find it easily later.</p>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
              <span className="text-slate-500">📁</span>
              <input
                type="text"
                name="name"
                required
                placeholder='e.g. "The Dragon&apos;s Tale — Chapter 1"'
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Import Method */}
          <div className="mt-6">
            <label className="text-sm font-semibold text-white">Import Method</label>
            <p className="mt-0.5 text-xs text-slate-500">Choose how you want to add your story.</p>
            <input type="hidden" name="method" value={method} />
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMethod("paste")}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                  method === "paste"
                    ? "border-indigo-400/50 bg-indigo-500/10"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                }`}
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-lg">
                  📝
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Paste Story Text</p>
                  <p className="mt-0.5 text-xs text-slate-400">Paste your story text and split it into scenes.</p>
                </div>
                <span
                  className={`mt-1 h-[18px] w-[18px] flex-shrink-0 rounded-full border-2 ${
                    method === "paste" ? "border-blue-400 bg-blue-400/0 ring-4 ring-blue-400/20" : "border-slate-500"
                  }`}
                >
                  {method === "paste" && <span className="block h-full w-full scale-50 rounded-full bg-blue-400" />}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMethod("csv")}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                  method === "csv"
                    ? "border-indigo-400/50 bg-indigo-500/10"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                }`}
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-lg">
                  🗂️
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Upload CSV / Script File</p>
                  <p className="mt-0.5 text-xs text-slate-400">Upload your CSV or script file with scene details.</p>
                </div>
                <span
                  className={`mt-1 h-[18px] w-[18px] flex-shrink-0 rounded-full border-2 ${
                    method === "csv" ? "border-blue-400 ring-4 ring-blue-400/20" : "border-slate-500"
                  }`}
                >
                  {method === "csv" && <span className="block h-full w-full scale-50 rounded-full bg-blue-400" />}
                </span>
              </button>
            </div>
          </div>

          {/* Story text (paste mode) */}
          {method === "paste" && (
            <div className="mt-6">
              <label className="text-sm font-semibold text-white">Story Text</label>
              <p className="mt-0.5 text-xs text-slate-500">
                Paste your complete story here — it&apos;s split into scenes on blank lines.
              </p>
              <textarea
                name="storyText"
                rows={5}
                placeholder="Paste or type your story here..."
                className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
              />
            </div>
          )}

          {/* CSV upload (csv mode) */}
          {method === "csv" && (
            <div className="mt-6">
              <label className="text-sm font-semibold text-white">Script File</label>
              <p className="mt-0.5 text-xs text-slate-500">
                Accepts .csv, .tsv, or .txt (delimiter is auto-detected). Columns (any casing/underscores): text
                (required), title, speaker/character, voice, gender, style, emotion, speed, pitch, sceneNumber.
              </p>
              <input
                type="file"
                name="csvFile"
                accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
                className="mt-2 w-full text-sm text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-white/20"
              />
            </div>
          )}

          {/* Voice + Language */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-white">Default Narrator Voice</label>
              <p className="mt-0.5 text-xs text-slate-500">Choose the main narrator voice for this project.</p>
              <select
                name="voice"
                defaultValue={VOICES[0].value}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-indigo-400 focus:outline-none"
              >
                {VOICES.map((v) => (
                  <option key={v.value} value={v.value} className="bg-[#10131f]">
                    {v.icon} {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-white">Language / Accent</label>
              <p className="mt-0.5 text-xs text-slate-500">Select the language for narration.</p>
              <select
                name="language"
                defaultValue={LANGUAGES[0].value}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-indigo-400 focus:outline-none"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value} className="bg-[#10131f]">
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ErrorText message={state && !state.ok ? state.message : undefined} />

          {/* Footer */}
          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10"
            >
              Cancel
            </button>
            <SubmitButton pendingChildren="Creating...">Create Project →</SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
