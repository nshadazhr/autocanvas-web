import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient' | 'outlineDark';

export type ButtonSize = 'sm' | 'md';

const VARIANT_STYLES: Record<ButtonVariant, string> = {
	primary: 'bg-indigo-600 text-white hover:bg-indigo-500 disabled:hover:bg-indigo-600',

	secondary: 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50',

	ghost: 'text-slate-600 hover:bg-slate-100',

	danger: 'text-red-600 hover:bg-red-50',

	gradient: 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg shadow-indigo-500/25 hover:opacity-90',

	outlineDark: 'border border-white/15 bg-transparent text-white hover:border-white/25 hover:bg-white/10'
};

const SIZE_STYLES: Record<ButtonSize, string> = {
	sm: 'px-2.5 py-1.5 text-xs',
	md: 'px-4 py-2 text-sm'
};

const RADIUS_STYLES: Record<ButtonVariant, string> = {
	primary: 'rounded-md',
	secondary: 'rounded-md',
	ghost: 'rounded-md',
	danger: 'rounded-md',
	gradient: 'rounded-full',
	outlineDark: 'rounded-full'
};

/**
 * Shared button styling.
 * Used by Button, LinkButton and other button elements.
 */
export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
	return cn(
		'inline-flex items-center justify-center gap-1.5 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
		RADIUS_STYLES[variant],
		VARIANT_STYLES[variant],
		SIZE_STYLES[size],
		className
	);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
	return <button className={buttonClasses(variant, size, className)} {...props} />;
}

interface LinkButtonProps {
	href: string;
	variant?: ButtonVariant;
	size?: ButtonSize;
	className?: string;
	children: ReactNode;
}

export function LinkButton({ href, variant = 'primary', size = 'md', className, children }: LinkButtonProps) {
	return (
		<Link href={href} className={buttonClasses(variant, size, className)}>
			{children}
		</Link>
	);
}
