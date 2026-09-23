import type { Config } from "tailwindcss";

// Standard App Router content globs — Audio Studio (Chunk 7) is the first
// feature to actually author Tailwind classes; everything before it used
// plain inline styles (see layout.tsx's old comment), so this file and
// globals.css didn't need to exist until now.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
