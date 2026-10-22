'use client';

import { useContext } from 'react';
import { AuthContext } from '../providers/AuthProvider';
import { LogoutButton } from './auth/LogoutButton';

interface AppTopbarProps {
	planLabel: string;
	creditBalance: number;
	onMenuToggle: () => void;
}

export function AppTopbar({ planLabel, creditBalance, onMenuToggle }: AppTopbarProps) {
	const { user } = useContext(AuthContext);
	const userName = user?.name ?? 'My Account';

	return (
		<header className='flex h-16 min-w-0 shrink-0 items-center gap-2 border-b border-white/10 bg-[#05050c] px-3 sm:gap-4 sm:px-6'>
			{/* Mobile hamburger menu */}
			<button
				type='button'
				onClick={onMenuToggle}
				aria-label='Toggle navigation menu'
				className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white transition-colors hover:bg-white/10 md:hidden'
			>
				<svg
					xmlns='http://www.w3.org/2000/svg'
					width='20'
					height='20'
					viewBox='0 0 24 24'
					fill='none'
					stroke='currentColor'
					strokeWidth='2'
					strokeLinecap='round'
					strokeLinejoin='round'
					aria-hidden='true'
				>
					<path d='M4 6h16M4 12h16M4 18h16' />
				</svg>
			</button>

			{/* Search: desktop/tablet only */}
			<div className='hidden min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400 md:flex'>
				<span>🔍</span>
				<input
					type='text'
					placeholder='Search projects, files, templates...'
					disabled
					className='min-w-0 w-full bg-transparent text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none'
				/>
			</div>

			{/* Credit balance */}
			<span className='flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2 py-1.5 text-xs font-medium text-indigo-300 sm:gap-1.5 sm:px-3 sm:text-sm'>
				💰 {creditBalance.toLocaleString()} credits
			</span>

			{/* User information */}
			<div className='ml-auto hidden min-w-0 shrink-0 flex-col items-end leading-tight sm:flex'>
				<span className='max-w-36 truncate text-sm font-medium text-white'>{userName}</span>
				<span className='text-xs text-slate-500'>{planLabel}</span>
			</div>

			{/* Notification icon */}
			<span className='hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm sm:flex'>
				🔔
			</span>

			{/* Existing logout functionality */}
			<div className='ml-auto flex shrink-0 items-center'>
				<LogoutButton />
			</div>
		</header>
	);
}
