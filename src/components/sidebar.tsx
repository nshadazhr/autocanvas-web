'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
	mobileOpen?: boolean;
	onMobileClose?: () => void;
}

const NAV_SECTIONS: {
	label: string;
	items: {
		href: string;
		label: string;
		icon: string;
	}[];
}[] = [
	{
		label: '',
		items: [{ href: '/dashboard', label: 'Home', icon: '🏠' }]
	},
	{
		label: '',
		items: [
			{ href: '/audio', label: 'Audio Studio', icon: '🎧' },
			{ href: '/script', label: 'Script Studio', icon: '📝' },
			{ href: '/images', label: 'Image Studio', icon: '🖼️' },
			{ href: '/thumbnails', label: 'Thumbnail Studio', icon: '🖼' },
			{ href: '/animation', label: 'Video Studio', icon: '▶️' }
		]
	},
	{
		label: 'Workspace',
		items: [
			{ href: '/projects', label: 'Projects', icon: '📁' },
			{ href: '/templates', label: 'Templates', icon: '🧩' },
			{ href: '/assets', label: 'Assets', icon: '🗂️' },
			{ href: '/workflows', label: 'Workflows', icon: '🔀' },
			{ href: '/billing', label: 'Billing', icon: '💳' },
			{ href: '/settings', label: 'Settings', icon: '⚙️' }
		]
	}
];

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
	const pathname = usePathname();

	useEffect(() => {
		if (!mobileOpen) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onMobileClose?.();
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [mobileOpen, onMobileClose]);

	return (
		<>
			{/* Mobile overlay */}
			{mobileOpen && (
				<div className='fixed inset-0 z-40 bg-black/70 md:hidden' onClick={onMobileClose} aria-hidden='true' />
			)}

			<aside
				id='app-sidebar'
				aria-label='Main navigation'
				className={`
                    fixed inset-y-0 left-0 z-50
                    flex h-dvh w-64 shrink-0 flex-col
                    border-r border-white/10
                    bg-[#05050c]
                    transition-transform duration-200 ease-in-out
                    md:sticky md:top-0 md:z-auto md:h-screen
                    md:translate-x-0
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
			>
				{/* Logo */}
				<div className='flex items-center justify-between'>
					<Link href='/dashboard' onClick={onMobileClose} className='flex items-center gap-2.5 px-5 py-5'>
						<span className='flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-lg font-bold text-white'>
							A
						</span>

						<span className='flex flex-col leading-none'>
							<span className='text-sm font-bold tracking-tight text-white'>
								Auto
								<span className='text-indigo-400'>Canvas</span>
							</span>

							<span className='mt-0.5 text-[10px] text-slate-500'>Create. Animate. Share.</span>
						</span>
					</Link>

					{/* Mobile close button */}
					<button
						type='button'
						onClick={onMobileClose}
						aria-label='Close navigation menu'
						className='mr-3 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white md:hidden'
					>
						✕
					</button>
				</div>

				{/* Navigation */}
				<nav className='flex-1 overflow-y-auto px-3 pb-4'>
					{NAV_SECTIONS.map((section, i) => (
						<div key={section.label || `top-${i}`} className='mb-4'>
							{section.label && (
								<p className='mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500'>
									{section.label}
								</p>
							)}

							<div className='flex flex-col gap-0.5'>
								{section.items.map(item => {
									const active = pathname === item.href || pathname?.startsWith(item.href + '/');

									return (
										<Link
											key={item.href}
											href={item.href}
											onClick={onMobileClose}
											aria-current={active ? 'page' : undefined}
											className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
												active
													? 'bg-indigo-500/15 text-white'
													: 'text-slate-400 hover:bg-white/5 hover:text-white'
											}`}
										>
											<span className='text-base'>{item.icon}</span>

											{item.label}
										</Link>
									);
								})}
							</div>
						</div>
					))}
				</nav>

				{/* Upgrade to Pro */}
				<div className='mx-3 mb-4 rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-blue-500/5 p-4'>
					<p className='flex items-center gap-1.5 text-sm font-semibold text-white'>🏆 Upgrade to Pro</p>

					<p className='mt-1 text-xs leading-snug text-slate-400'>
						Get more credits, premium voices and advanced features.
					</p>

					<Link
						href='/billing'
						onClick={onMobileClose}
						className='mt-3 flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-opacity hover:opacity-90'
					>
						Upgrade Now
					</Link>
				</div>
			</aside>
		</>
	);
}
