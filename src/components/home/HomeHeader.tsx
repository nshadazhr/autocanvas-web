import { getStrings } from '../../lib/appResolvers';
const lsv = getStrings();
import Link from 'next/link';
import { HeaderActions } from '../layout/HeaderActions';
import { NAV_LINKS } from './homeData';

export default function HomeHeader() {
	return (
		<header className='sticky top-0 z-50 border-b border-white/10 bg-[#05050c]/80 backdrop-blur'>
			<div className='mx-auto flex max-w-7xl items-center justify-between px-6 py-4'>
				<Link href='/' className='flex items-center gap-2.5'>
					<span className='flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-lg font-bold'>
						A
					</span>
					<span className='flex flex-col leading-none'>
						<span className='text-lg font-bold tracking-tight'>
							{lsv('brandFirst')}
							<span className='text-indigo-400'>{lsv('brandSecond')}</span>
						</span>
						<span className='text-[11px] text-slate-400'>{lsv('brandTagline')}</span>
					</span>
				</Link>

				<nav className='hidden items-center gap-8 text-sm text-slate-300 lg:flex'>
					{NAV_LINKS.map(link => (
						<Link key={link.labelKey} href={link.href} className='transition-colors hover:text-white'>
							{lsv(link.labelKey)}
						</Link>
					))}
				</nav>
				<HeaderActions />
			</div>
		</header>
	);
}
