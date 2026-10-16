import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type BadgeTone = 'slate' | 'amber' | 'blue' | 'green' | 'red' | 'indigo';

export type BadgeVariant = 'light' | 'dark';

const TONE_STYLES: Record<BadgeVariant, Record<BadgeTone, string>> = {
	light: {
		slate: 'bg-slate-100 text-slate-600',
		amber: 'bg-amber-100 text-amber-700',
		blue: 'bg-blue-100 text-blue-700',
		green: 'bg-green-100 text-green-700',
		red: 'bg-red-100 text-red-700',
		indigo: 'bg-indigo-100 text-indigo-700'
	},
	dark: {
		slate: 'bg-slate-500/10 text-slate-400',
		amber: 'bg-amber-500/10 text-amber-400',
		blue: 'bg-blue-500/10 text-blue-400',
		green: 'bg-emerald-500/10 text-emerald-400',
		red: 'bg-red-500/10 text-red-400',
		indigo: 'bg-indigo-500/10 text-indigo-400'
	}
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	tone?: BadgeTone;
	variant?: BadgeVariant;
}

export function Badge({ tone = 'slate', variant = 'light', className, ...props }: BadgeProps) {
	return (
		<span
			className={cn(
				'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
				TONE_STYLES[variant][tone],
				className
			)}
			{...props}
		/>
	);
}

const STATUS_TONE: Record<string, BadgeTone> = {
	PENDING: 'slate',
	QUEUED: 'amber',
	PROCESSING: 'blue',
	COMPLETED: 'green',
	FAILED: 'red',
	INVALID_ANALYSIS: 'amber'
};

interface StatusBadgeProps {
	status: string;
	variant?: BadgeVariant;
	label?: string;
}

export function StatusBadge({ status, variant = 'light', label }: StatusBadgeProps) {
	return (
		<Badge tone={STATUS_TONE[status] ?? 'slate'} variant={variant}>
			{label ?? status}
		</Badge>
	);
}
