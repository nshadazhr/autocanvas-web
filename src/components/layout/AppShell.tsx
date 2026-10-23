'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

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
	const pathname = usePathname();
	const isStoryEditor = /^\/audio\/stories\/[^/]+\/?$/.test(pathname);

	return (
		<div className={`flex bg-[#05050c] ${isStoryEditor ? 'h-dvh overflow-hidden' : 'min-h-screen'}`}>
			<Sidebar mobileOpen={isOpen} onMobileClose={closeMenu} />

			<div className={`flex min-w-0 flex-1 flex-col ${isStoryEditor ? 'min-h-0' : 'min-h-screen'}`}>
				<AppTopbar planLabel={planLabel} creditBalance={creditBalance} onMenuToggle={toggleMenu} />

				<main className={`min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-8 ${isStoryEditor ? 'min-h-0 overflow-y-auto' : ''}`}>{children}</main>
			</div>
		</div>
	);
}
