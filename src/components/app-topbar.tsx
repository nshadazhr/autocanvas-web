'use client';

import { useContext } from 'react';
import { AuthContext } from '../providers/AuthProvider';
import { LogoutButton } from './auth/LogoutButton';

export function AppTopbar({ planLabel, creditBalance }: { planLabel: string; creditBalance: number }) {
	const { user } = useContext(AuthContext);
	const userName = user?.name ?? 'My Account';	
	
	return (
		<header className='flex h-16 items-center gap-4 border-b border-white/10 bg-[#05050c] px-6'>
			<div className='flex flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400'>
				<span>🔍</span>
				<input
					type='text'
					placeholder='Search projects, files, templates...'
					disabled
					className='w-full bg-transparent text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none'
				/>
			</div>

			<span className='flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1.5 text-sm font-medium text-indigo-300'>
				💰 {creditBalance.toLocaleString()} credits
			</span>

			<div className='flex flex-shrink-0 flex-col items-end leading-tight'>
				<span className='text-sm font-medium text-white'>{userName}</span>
				<span className='text-xs text-slate-500'>{planLabel}</span>
			</div>

			<span className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-sm'>
				🔔
			</span>

			<LogoutButton />
		</header>
	);
}
