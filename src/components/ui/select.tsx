import type { SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type SelectVariant = 'light' | 'dark';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
	variant?: SelectVariant;
}

export function Select({ variant = 'light', className, children, ...props }: SelectProps) {
	return (
		<select
			className={cn(
				'w-full min-w-0 rounded-xl border px-4 py-3 text-sm outline-none transition-colors',
				'disabled:cursor-not-allowed disabled:opacity-50',
				variant === 'dark'
					? 'border-white/10 bg-slate-900 text-white focus:border-indigo-500/50'
					: 'border-slate-300 bg-white text-slate-900 focus:border-indigo-500',
				className
			)}
			{...props}
		>
			{children}
		</select>
	);
}
