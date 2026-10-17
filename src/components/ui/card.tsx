import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

type CardProps = HTMLAttributes<HTMLDivElement> & {
	variant?: 'light' | 'dark';
};

export function Card({ className, variant = 'light', ...props }: CardProps) {
	return (
		<div
			className={cn(
				'rounded-xl border shadow-sm',
				variant === 'dark' ? 'border-white/10 bg-white/[0.03] shadow-none' : 'border-slate-200 bg-white',
				className
			)}
			{...props}
		/>
	);
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div className={cn('flex flex-col gap-1 border-b border-slate-100 p-5', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
	return <h3 className={cn('text-base font-semibold text-slate-900', className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
	return <p className={cn('text-sm text-slate-500', className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div className={cn('p-5', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div className={cn('border-t border-slate-100 p-5', className)} {...props} />;
}

export function StatTile({
	label,
	value,
	hint,
	icon,
	variant = 'light'
}: {
	label: string;
	value: ReactNode;
	hint?: ReactNode;
	icon?: ReactNode;
	variant?: 'light' | 'dark';
}) {
	const isDark = variant === 'dark';

	return (
		<Card variant={variant} className='p-4'>
			<div className='flex items-center justify-between gap-3'>
				<p className={cn('text-sm font-medium', isDark ? 'text-slate-400' : 'text-slate-500')}>{label}</p>
				{icon}
			</div>

			<p className={cn('mt-2 text-2xl font-semibold', isDark ? 'text-white' : 'text-slate-900')}>{value}</p>

			{hint ? <p className={cn('mt-1 text-xs', isDark ? 'text-slate-500' : 'text-slate-400')}>{hint}</p> : null}
		</Card>
	);
}
