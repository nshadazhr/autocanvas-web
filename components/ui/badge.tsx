import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export type BadgeTone = "slate" | "amber" | "blue" | "green" | "red" | "indigo";

const TONE_STYLES: Record<BadgeTone, string> = {
  slate: "bg-slate-100 text-slate-600",
  amber: "bg-amber-100 text-amber-700",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
  indigo: "bg-indigo-100 text-indigo-700",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = "slate", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", TONE_STYLES[tone], className)}
      {...props}
    />
  );
}

/** Audio Studio scene/job status → badge tone. Centralized here so every
 * page that renders a status pill (Audio Studio list, detail, later Admin
 * jobs page) agrees on the same colors instead of each re-inventing the
 * `Record<string, string>` map. */
const STATUS_TONE: Record<string, BadgeTone> = {
  PENDING: "slate",
  QUEUED: "amber",
  PROCESSING: "blue",
  COMPLETED: "green",
  FAILED: "red",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "slate"}>{status}</Badge>;
}
