import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "AutoCanvas — Create. Animate. Share.",
  description: "AI-powered content creation, starting with Audio Studio.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      {/* Tailwind is wired up as of Chunk 7 (Audio Studio) — earlier pages
         (login/register/dashboard) still use their original inline styles
         and are left as-is; only Audio Studio's new pages use Tailwind
         classes for now. */}
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">{children}</body>
    </html>
  );
}
