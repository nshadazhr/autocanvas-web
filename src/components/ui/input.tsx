import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type InputVariant = 'light' | 'dark';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	variant?: InputVariant;
}

export function Input({ variant = 'light', className, ...props }: InputProps) {
	return (
		<input
			className={cn(
				'w-full min-w-0 rounded-xl border px-4 py-3 text-sm outline-none transition-colors',
				'disabled:cursor-not-allowed disabled:opacity-50',
				variant === 'dark'
					? 'border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 focus:border-indigo-500/50'
					: 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-500',
				className
			)}
			{...props}
		/>
	);
}
