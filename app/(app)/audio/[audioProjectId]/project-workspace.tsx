"use client";

// The Story / Scenes / Generate workspace for a single Audio Studio project
// — this is the "esa bnao" screen: a rich, per-scene data-grid (speaker,
// style, emotion, voice, gender, speed, pitch, credits) with bulk actions,
// matching the reference design. Everything here calls the real Server
// Actions in ../actions.ts, which read/write lib/dummy-data.ts — there's no
// mock data left in this component, only UI state for edits-in-progress
// and which tab/rows are active.

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateScenes,
  applyVoiceToSpeaker,
  resetScenesToPending,
  checkCredits,
  generateSceneAudio,
  generateAllPendingScenes,
  deleteScene,
  type AudioProjectDetail,
  type AudioSceneDetailRow,
  type SceneFieldUpdate,
} from "../actions";
import { VOICE_CATALOG, STYLE_OPTIONS, EMOTION_OPTIONS, FEATURE_FLAGS } from "../catalogs";
import { AddSceneForm, CsvImportForm, ExportForm, PlayOrDownloadLink, primaryButtonClasses } from "../action-forms";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  QUEUED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  PROCESSING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? STATUS_STYLES.PENDING}`}>
      {status}
    </span>
  );
}

function formatDuration(totalWords: number): string {
  const seconds = Math.round((totalWords / 150) * 60);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

const selectClasses =
  "rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white focus:border-indigo-400 focus:outline-none";
const numberClasses =
  "w-16 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white focus:border-indigo-400 focus:outline-none";
const textClasses =
  "w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white focus:border-indigo-400 focus:outline-none";

type SceneRow = AudioSceneDetailRow;

export function ProjectWorkspace({
  audioProject,
  creditStats,
}: {
  audioProject: AudioProjectDetail;
  creditStats: { creditsRequired: number; availableCredits: number };
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"story" | "scenes" | "generate">("scenes");
  const [rows, setRows] = useState<SceneRow[]>(audioProject.scenes);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [speakerFilter, setSpeakerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [banner, setBanner] = useState<{ tone: "info" | "success" | "error"; text: string } | null>(null);
  const [applyVoicePanel, setApplyVoicePanel] = useState(false);
  const [applyVoiceSpeaker, setApplyVoiceSpeaker] = useState("");
  const [applyVoiceChoice, setApplyVoiceChoice] = useState(VOICE_CATALOG[0].value);
  const [isPending, startTransition] = useTransition();

  // Re-sync from fresh server data after router.refresh() lands new props
  // (keyed on lastSavedAt, which only changes when a mutation actually
  // happened server-side) — clears any unsaved local edits, same tradeoff
  // any "revert on refresh" editable table has.
  useEffect(() => {
    setRows(audioProject.scenes);
    setDirtyIds(new Set());
  }, [audioProject.lastSavedAt, audioProject.scenes]);

  const speakers = useMemo(() => Object.keys(audioProject.speakers).sort(), [audioProject.speakers]);

  // 12 columns are always shown (checkbox, #, Title, Text, Speaker, Style,
  // Emotion, Voice, Gender, Status, Credits, actions) plus however many of
  // Speed/Pitch/Words/Chars are switched on in lib/feature-flags.json —
  // used for the "no rows" empty-state colSpan so it never under/overshoots
  // the real number of visible <th>s.
  const visibleColumnCount =
    12 +
    (FEATURE_FLAGS.speed ? 1 : 0) +
    (FEATURE_FLAGS.pitch ? 1 : 0) +
    (FEATURE_FLAGS.words ? 1 : 0) +
    (FEATURE_FLAGS.characters ? 1 : 0);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (speakerFilter !== "all" && r.speaker !== speakerFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!r.text.toLowerCase().includes(q) && !(r.title ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rows, speakerFilter, statusFilter, search]);

  const totalWords = rows.reduce((sum, r) => sum + r.words, 0);
  const totalCharacters = rows.reduce((sum, r) => sum + r.characters, 0);

  function updateRow(id: string, patch: Partial<SceneRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setDirtyIds((prev) => new Set(prev).add(id));
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.size === filteredRows.length ? new Set() : new Set(filteredRows.map((r) => r.id))));
  }

  function saveChanges() {
    const updates: SceneFieldUpdate[] = rows
      .filter((r) => dirtyIds.has(r.id))
      .map((r) => ({
        id: r.id,
        title: r.title,
        text: r.text,
        speaker: r.speaker,
        style: r.style,
        emotion: r.emotion,
        voice: r.voice,
        gender: r.gender,
        speed: r.speed,
        pitch: r.pitch,
      }));
    if (updates.length === 0) {
      setBanner({ tone: "info", text: "No changes to save." });
      return;
    }
    startTransition(async () => {
      const result = await updateScenes(audioProject.id, updates);
      if (result.ok) {
        setDirtyIds(new Set());
        setBanner({ tone: "success", text: `Saved ${updates.length} scene${updates.length === 1 ? "" : "s"}.` });
        router.refresh();
      } else {
        setBanner({ tone: "error", text: result.message ?? "Failed to save changes." });
      }
    });
  }

  function generateAudio() {
    const targetIds = selectedIds.size > 0 ? Array.from(selectedIds) : rows.filter((r) => r.status === "PENDING" || r.status === "FAILED").map((r) => r.id);
    if (targetIds.length === 0) {
      setBanner({ tone: "info", text: "Nothing to generate — select scenes or add new ones." });
      return;
    }
    startTransition(async () => {
      if (selectedIds.size > 0) {
        for (const id of targetIds) {
          await generateSceneAudio(id);
        }
      } else {
        await generateAllPendingScenes(audioProject.id);
      }
      setBanner({ tone: "success", text: `Generated audio for ${targetIds.length} scene${targetIds.length === 1 ? "" : "s"}.` });
      setSelectedIds(new Set());
      router.refresh();
    });
  }

  function resetSelected() {
    if (selectedIds.size === 0) {
      setBanner({ tone: "info", text: "Select scenes to reset first." });
      return;
    }
    startTransition(async () => {
      const result = await resetScenesToPending(audioProject.id, Array.from(selectedIds));
      if (result.ok) {
        setBanner({ tone: "success", text: `Reset ${result.data?.affected ?? 0} scene(s) to pending.` });
        setSelectedIds(new Set());
        router.refresh();
      } else {
        setBanner({ tone: "error", text: result.message ?? "Failed to reset scenes." });
      }
    });
  }

  function runCheckCredits() {
    const targetRows = selectedIds.size > 0 ? rows.filter((r) => selectedIds.has(r.id)) : rows.filter((r) => r.status !== "COMPLETED");
    const chars = targetRows.reduce((sum, r) => sum + r.characters, 0);
    startTransition(async () => {
      const result = await checkCredits(chars);
      const short = result.creditsRequired > result.availableCredits;
      setBanner({
        tone: short ? "error" : "success",
        text: `${result.creditsRequired} credits required for ${targetRows.length} scene(s) · ${result.availableCredits} available${short ? " — not enough credits" : ""}.`,
      });
    });
  }

  function confirmApplyVoice() {
    if (!applyVoiceSpeaker) return;
    const voiceOption = VOICE_CATALOG.find((v) => v.value === applyVoiceChoice) ?? VOICE_CATALOG[0];
    startTransition(async () => {
      const result = await applyVoiceToSpeaker(audioProject.id, applyVoiceSpeaker, voiceOption.value, voiceOption.gender);
      if (result.ok) {
        setBanner({ tone: "success", text: `Applied ${voiceOption.label} to ${result.data?.affected ?? 0} scene(s) spoken by ${applyVoiceSpeaker}.` });
        setApplyVoicePanel(false);
        router.refresh();
      } else {
        setBanner({ tone: "error", text: result.message ?? "Failed to apply voice." });
      }
    });
  }

  function exportCsv() {
    const header = ["Scene", "Title", "Speaker", "Text", "Style", "Emotion", "Voice", "Gender", "Speed", "Pitch", "Status", "Words", "Characters", "Credits"];
    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push(
        [r.sceneNumber, r.title ?? "", r.speaker, r.text, r.style, r.emotion, r.voice, r.gender, r.speed, r.pitch, r.status, r.words, r.characters, r.credits]
          .map(escape)
          .join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${audioProject.project.name.replace(/\s+/g, "-").toLowerCase()}-scenes.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete(sceneId: string) {
    if (!confirm("Delete this scene? This cannot be undone.")) return;
    await deleteScene(audioProject.id, sceneId);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 border-b border-white/10">
        {(["story", "scenes", "generate"] as const).map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
              tab === t ? "border-b-2 border-indigo-400 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            {i + 1}. {t}
          </button>
        ))}
      </div>

      {banner && (
        <div
          className={`rounded-lg border px-4 py-2.5 text-sm ${
            banner.tone === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
              : banner.tone === "error"
                ? "border-red-500/20 bg-red-500/10 text-red-300"
                : "border-white/10 bg-white/5 text-slate-300"
          }`}
        >
          {banner.text}
          <button onClick={() => setBanner(null)} className="ml-3 text-xs text-slate-500 hover:text-slate-300">
            dismiss
          </button>
        </div>
      )}

      {tab === "story" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-medium text-slate-300">Full story ({rows.length} scene{rows.length === 1 ? "" : "s"})</p>
            {rows.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No content yet — paste text or import a CSV below.</p>
            ) : (
              <div className="mt-2 flex flex-col gap-3">
                {[...rows]
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((r) => (
                    <p key={r.id} className="text-sm leading-relaxed text-slate-400">
                      <span className="mr-2 text-xs font-semibold text-slate-500">{r.speaker}:</span>
                      {r.text}
                    </p>
                  ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <CsvImportForm audioProjectId={audioProject.id} />
            </div>
            <div className="flex-1">
              <AddSceneForm audioProjectId={audioProject.id} />
            </div>
          </div>
        </div>
      )}

      {tab === "scenes" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <StatCard label="Total Scenes" value={String(rows.length)} />
            <StatCard label="Speakers" value={String(speakers.length)} />
            <StatCard label="Est. Duration" value={formatDuration(totalWords)} />
            <StatCard label="Total Characters" value={totalCharacters.toLocaleString()} />
            <StatCard label="Credits Required" value={String(creditStats.creditsRequired)} hint="for remaining scenes" />
            <StatCard label="Available Credits" value={creditStats.availableCredits.toLocaleString()} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scene text or title..."
              className="w-64 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
            />
            <select value={speakerFilter} onChange={(e) => setSpeakerFilter(e.target.value)} className={selectClasses}>
              <option value="all">All speakers</option>
              {speakers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClasses}>
              <option value="all">All statuses</option>
              {Object.keys(STATUS_STYLES).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500">
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${filteredRows.length} shown`}
            </span>
          </div>

          {/* Suggestions only, not a restriction — Style/Emotion are free-text
              fields (matching the Python importer, which stores whatever
              string a CSV's style/emotion column holds), so a `<select>`
              limited to these few presets would silently hide/clobber any
              imported value that isn't one of them, e.g. "calm storytelling"
              or "tender" from a real CSV. */}
          <datalist id="style-options">
            {STYLE_OPTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <datalist id="emotion-options">
            {EMOTION_OPTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>

          {/* Scrolls internally (max-h + overflow-y-auto) instead of letting
              the scene rows grow the whole page — with 40+ scenes the page
              used to scroll past the stat cards, filters, and even the Save
              Changes/Generate Audio bar below just to see later rows. The
              header row is sticky within this same scroll container so
              column labels stay put while scrolling through scenes. */}
          <div className="max-h-[65vh] overflow-x-auto overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03]">
            <table className="w-full min-w-[1200px] text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-white/10 bg-[#0b0b16] text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={filteredRows.length > 0 && selectedIds.size === filteredRows.length}
                      onChange={toggleSelectAll}
                      className="accent-indigo-500"
                    />
                  </th>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Text</th>
                  <th className="px-3 py-2">Speaker</th>
                  <th className="px-3 py-2">Style</th>
                  <th className="px-3 py-2">Emotion</th>
                  <th className="px-3 py-2">Voice</th>
                  <th className="px-3 py-2">Gender</th>
                  {FEATURE_FLAGS.speed && <th className="px-3 py-2">Speed</th>}
                  {FEATURE_FLAGS.pitch && <th className="px-3 py-2">Pitch</th>}
                  <th className="px-3 py-2">Status</th>
                  {FEATURE_FLAGS.words && <th className="px-3 py-2">Words</th>}
                  {FEATURE_FLAGS.characters && <th className="px-3 py-2">Chars</th>}
                  <th className="px-3 py-2">Credits</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount} className="px-3 py-8 text-center text-sm text-slate-500">
                      No scenes match these filters.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r) => {
                    const latestGeneration = r.generations[0];
                    return (
                      <tr key={r.id} className="border-b border-white/5 align-top">
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} className="accent-indigo-500" />
                        </td>
                        <td className="px-3 py-2 text-slate-300">
                          <span className="font-medium">#{r.sceneNumber}</span>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={r.title ?? ""}
                            onChange={(e) => updateRow(r.id, { title: e.target.value || null })}
                            placeholder="Title"
                            className={`${textClasses} w-28`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <textarea
                            value={r.text}
                            onChange={(e) => updateRow(r.id, { text: e.target.value })}
                            rows={2}
                            className={`${textClasses} min-w-[220px]`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={r.speaker}
                            onChange={(e) => updateRow(r.id, { speaker: e.target.value })}
                            className={`${textClasses} w-24`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            list="style-options"
                            value={r.style}
                            onChange={(e) => updateRow(r.id, { style: e.target.value })}
                            className={`${textClasses} w-28`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            list="emotion-options"
                            value={r.emotion}
                            onChange={(e) => updateRow(r.id, { emotion: e.target.value })}
                            className={`${textClasses} w-28`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={r.voice}
                            onChange={(e) => {
                              const opt = VOICE_CATALOG.find((v) => v.value === e.target.value);
                              updateRow(r.id, { voice: e.target.value, gender: opt?.gender ?? r.gender });
                            }}
                            className={selectClasses}
                          >
                            {VOICE_CATALOG.map((v) => (
                              <option key={v.value} value={v.value}>
                                {v.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-slate-400">{r.gender}</td>
                        {FEATURE_FLAGS.speed && (
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step={0.1}
                              min={0.5}
                              max={2}
                              value={r.speed}
                              onChange={(e) => updateRow(r.id, { speed: Number(e.target.value) })}
                              className={numberClasses}
                            />
                          </td>
                        )}
                        {FEATURE_FLAGS.pitch && (
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step={0.1}
                              min={0.5}
                              max={2}
                              value={r.pitch}
                              onChange={(e) => updateRow(r.id, { pitch: Number(e.target.value) })}
                              className={numberClasses}
                            />
                          </td>
                        )}
                        <td className="px-3 py-2">
                          <StatusBadge status={r.status} />
                        </td>
                        {FEATURE_FLAGS.words && <td className="px-3 py-2 text-slate-400">{r.words}</td>}
                        {FEATURE_FLAGS.characters && <td className="px-3 py-2 text-slate-400">{r.characters}</td>}
                        <td className="px-3 py-2 text-slate-400">{r.credits}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col items-start gap-1">
                            {r.status === "COMPLETED" && latestGeneration?.storageKey && (
                              <PlayOrDownloadLink storageKey={latestGeneration.storageKey} label="audio" />
                            )}
                            <button
                              onClick={() => handleDelete(r.id)}
                              className="text-xs font-medium text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {applyVoicePanel && (
            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-indigo-400/30 bg-indigo-500/5 p-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Speaker</label>
                <select value={applyVoiceSpeaker} onChange={(e) => setApplyVoiceSpeaker(e.target.value)} className={selectClasses}>
                  <option value="">Choose speaker...</option>
                  {speakers.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Voice</label>
                <select value={applyVoiceChoice} onChange={(e) => setApplyVoiceChoice(e.target.value)} className={selectClasses}>
                  {VOICE_CATALOG.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <button onClick={confirmApplyVoice} disabled={!applyVoiceSpeaker || isPending} className={primaryButtonClasses}>
                Apply
              </button>
              <button onClick={() => setApplyVoicePanel(false)} className="text-sm text-slate-400 hover:text-white">
                Cancel
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <button onClick={saveChanges} disabled={isPending || dirtyIds.size === 0} className={primaryButtonClasses}>
              Save Changes{dirtyIds.size > 0 ? ` (${dirtyIds.size})` : ""}
            </button>
            <button
              onClick={generateAudio}
              disabled={isPending}
              className="rounded-full bg-indigo-500/15 px-4 py-2 text-sm font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate Audio
            </button>
            <button
              onClick={exportCsv}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              Export CSV
            </button>
            <button
              onClick={runCheckCredits}
              disabled={isPending}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              Check Credits
            </button>
            <button
              onClick={() => setApplyVoicePanel((v) => !v)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              Apply Voice to Speaker
            </button>
            <button
              onClick={resetSelected}
              disabled={isPending || selectedIds.size === 0}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset Selected to Pending
            </button>
          </div>
        </div>
      )}

      {tab === "generate" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            {Object.keys(STATUS_STYLES).map((status) => (
              <StatCard key={status} label={status} value={String(rows.filter((r) => r.status === status).length)} />
            ))}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-medium text-slate-300">Generate remaining scenes</p>
            <p className="mt-1 text-sm text-slate-500">
              {creditStats.creditsRequired} credits required · {creditStats.availableCredits.toLocaleString()} available.
            </p>
            <div className="mt-3">
              <button
                onClick={generateAudio}
                disabled={isPending}
                className={primaryButtonClasses}
              >
                Generate all pending scenes
              </button>
            </div>
          </div>

          <ExportForm
            audioProjectId={audioProject.id}
            scenes={rows.map((r) => ({ id: r.id, sceneNumber: r.sceneNumber, title: r.title, status: r.status }))}
          />

          {audioProject.exports.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-slate-300">Past exports</p>
              <ul className="flex flex-col gap-2">
                {audioProject.exports.map((exp) => (
                  <li key={exp.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="text-sm text-slate-400">
                      {exp.type === "MERGED" ? "Merged export" : "Chunk export"} · {exp.sceneIds.length} scene
                      {exp.sceneIds.length === 1 ? "" : "s"} · {new Date(exp.createdAt).toLocaleString()}
                    </div>
                    <PlayOrDownloadLink storageKey={exp.storageKey} label="file" />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
