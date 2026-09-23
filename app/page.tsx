import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@platform/auth";

// Static marketing content for the "/" landing page. Everything here is
// hand-authored copy/dummy stats matching the AutoCanvas reference design —
// none of it reads from lib/dummy-data.ts, since this page is shown to
// signed-out visitors before there's any account/session to read from.

const NAV_LINKS = [
  { label: "Tools", href: "#tools" },
  { label: "Features", href: "#tools" },
  { label: "Templates", href: "#" },
  { label: "Pricing", href: "#" },
  { label: "FAQs", href: "#" },
];

const CHECKLIST = ["No technical skills required", "Create in minutes", "Used by 1,500+ creators"];

const FLOATING_CARDS = [
  { label: "Characters", emoji: "🧑‍🤝‍🧑", className: "left-2 top-4 sm:left-4 sm:top-6 -rotate-3" },
  { label: "Scripts", emoji: "📄", className: "right-2 top-0 sm:right-4 rotate-3" },
  { label: "Backgrounds", emoji: "🏞️", className: "left-0 top-1/2 -translate-y-1/2 sm:left-2 -rotate-2" },
  { label: "Thumbnails", emoji: "🖼️", className: "right-0 top-1/3 sm:right-2 rotate-2" },
  { label: "Voices", emoji: "🎙️", className: "left-4 bottom-2 sm:left-8 rotate-2" },
  { label: "Videos", emoji: "🎬", className: "right-4 bottom-0 sm:right-8 -rotate-3" },
];

const CHANNELS = [
  { name: "Toon Kahani", views: "12M Views", emoji: "🧑" },
  { name: "Moral Stories TV", views: "8M Views", emoji: "👩" },
  { name: "Village Tales", views: "6M Views", emoji: "🏡" },
  { name: "Kids Fun (Gen)", views: "5M Views", emoji: "🦒" },
  { name: "Story World", views: "4M Views", emoji: "🧒" },
  { name: "Desi Kahani", views: "3M Views", emoji: "🏠" },
];

const TOOLS = [
  { title: "Script Studio", description: "Generate engaging story scripts", emoji: "📝", tint: "bg-blue-500/15 text-blue-300" },
  { title: "Image Studio", description: "Create characters & backgrounds", emoji: "🖼️", tint: "bg-purple-500/15 text-purple-300" },
  { title: "Audio Studio", description: "Realistic AI voices in multiple languages", emoji: "🎵", tint: "bg-emerald-500/15 text-emerald-300" },
  { title: "Thumbnail Studio", description: "Eye-catching thumbnails with AI", emoji: "🖼", tint: "bg-amber-500/15 text-amber-300" },
  { title: "Video Studio", description: "Create animated videos easily", emoji: "▶️", tint: "bg-blue-500/15 text-blue-300" },
  { title: "Templates", description: "Ready-to-use assets & templates", emoji: "🧩", tint: "bg-indigo-500/15 text-indigo-300" },
  { title: "Projects", description: "Organize all your creations", emoji: "📁", tint: "bg-sky-500/15 text-sky-300" },
  { title: "More Tools", description: "Everything you need in one place", emoji: "✨", tint: "bg-violet-500/15 text-violet-300" },
];

const STATS = [
  { label: "Creators Worldwide", value: "1,500+", emoji: "👥" },
  { label: "Videos Created", value: "10M+", emoji: "▶️" },
  { label: "Creator Rating", value: "4.9/5", emoji: "⭐" },
  { label: "Hindi, English & More", value: "Multiple Languages", emoji: "🌐" },
];

export default async function HomePage() {
  const session = await auth();
  // Middleware already sends a logged-in visit of "/" straight to
  // /dashboard (see middleware.ts's PUBLIC_PATHS handling) — this is a
  // defensive backstop in case that ever changes, same reasoning as the
  // `if (!session?.user) return null;` guards on the other app pages.
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#05050c] text-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#05050c]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
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

          <nav className="hidden items-center gap-8 text-sm text-slate-300 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className="transition-colors hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 text-sm sm:flex">
              ☀️
            </span>
            <Link
              href="/login"
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-opacity hover:opacity-90"
            >
              My Projects
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-indigo-600/25 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-16 px-6 py-20 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-slate-300">
              ⚡ 5x Faster Content Creation
            </span>

            <h1 className="max-w-xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Turn Your Ideas Into{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Amazing Stories
              </span>
            </h1>

            <p className="max-w-lg text-lg text-slate-400">
              All-in-one AI platform to create cartoon stories, generate characters, backgrounds, voices, thumbnails
              and videos — built for YouTubers, creators and storytellers.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-opacity hover:opacity-90"
              >
                🚀 Launch App →
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                📁 My Projects
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400">
              {CHECKLIST.map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <span className="text-emerald-400">✔</span> {item}
                </span>
              ))}
            </div>
          </div>

          {/* Hero illustration */}
          <div className="relative mx-auto h-[360px] w-full max-w-md sm:h-[420px]">
            <div className="absolute inset-8 rounded-[2rem] bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-transparent blur-2xl" />
            <div className="absolute inset-10 flex items-center justify-center rounded-[2rem] border border-white/10 bg-white/5">
              <span className="text-7xl">🧑‍💻</span>
            </div>
            {FLOATING_CARDS.map((card) => (
              <div
                key={card.label}
                className={`absolute flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b0b16] px-3 py-2 text-xs font-medium text-slate-200 shadow-lg ${card.className}`}
              >
                <span>{card.emoji}</span>
                {card.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Channels strip */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <p className="mb-8 text-center text-sm text-slate-500">1500+ channels monetized with AutoCanvas</p>
        <div className="grid grid-cols-3 gap-6 sm:grid-cols-6">
          {CHANNELS.map((channel) => (
            <div key={channel.name} className="flex flex-col items-center gap-2 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-xl">
                {channel.emoji}
              </span>
              <span className="text-sm font-medium text-white">{channel.name}</span>
              <span className="text-xs text-slate-500">{channel.views}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Tools grid */}
      <section id="tools" className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {TOOLS.map((tool) => (
            <div
              key={tool.title}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.06]"
            >
              <span className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-lg ${tool.tint}`}>
                {tool.emoji}
              </span>
              <h3 className="text-sm font-semibold text-white">{tool.title}</h3>
              <p className="mt-1 text-xs text-slate-400">{tool.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats bar */}
      <section className="mx-auto max-w-5xl border-t border-white/10 px-6 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <span className="text-2xl">{stat.emoji}</span>
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-bold text-white">{stat.value}</span>
                <span className="text-xs text-slate-400">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
