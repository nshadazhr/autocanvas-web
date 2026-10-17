'use client';

import { useContext } from 'react';
import Link from 'next/link';
import { useAppSettings } from '../../hooks';
import { useStrings } from '../../hooks/useStrings';
import { AuthContext } from '../../providers/AuthProvider';

export default function HomeHeroActions() {
	const { initialized, isAuthenticated } = useContext(AuthContext);
	const { lsv } = useStrings();
	const { appSettings } = useAppSettings();

	if (!initialized) return <div className='h-11 w-40 animate-pulse rounded-full bg-white/10' />;

	return (
		<div className='flex flex-wrap items-center gap-3'>
			{isAuthenticated ? (
				<Link
					href='/dashboard'
					className='inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-opacity hover:opacity-90'
				>
					{lsv('launchButton')}
				</Link>
			) : (
				appSettings('enableRegistration') && (
					<Link
						href='/login'
						className='inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10'
					>
						{lsv('signupButton')}
					</Link>
				)
			)}
		</div>
	);
}
