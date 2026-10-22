'use client';

import type { ReactNode } from 'react';

import { Sidebar } from '../sidebar';
import { AppTopbar } from '../app-topbar';
import { useMobileMenu } from '../../hooks/useMobileMenu';

interface AppShellProps {
	children: ReactNode;
	planLabel: string;
	creditBalance: number;
}

export function AppShell({ children, planLabel, creditBalance }: AppShellProps) {
	const { isOpen, closeMenu, toggleMenu } = useMobileMenu();

	return (
		<div className='flex min-h-screen bg-[#05050c]'>
			<Sidebar mobileOpen={isOpen} onMobileClose={closeMenu} />

			<div className='flex min-h-screen min-w-0 flex-1 flex-col'>
				<AppTopbar planLabel={planLabel} creditBalance={creditBalance} onMenuToggle={toggleMenu} />

				<main className='min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-8'>{children}</main>
			</div>
		</div>
	);
}
