import { getStrings } from '../../lib/appResolvers';
const lsv = getStrings();
import { CHECKLIST, FLOATING_CARDS } from './homeData';
import HomeHeroActions from './HomeHeroActions';

export default function HomeHero() {
	return (
		<section className='relative overflow-hidden'>
			<div className='pointer-events-none absolute inset-0'>
				<div className='absolute -left-32 top-10 h-72 w-72 rounded-full bg-indigo-600/25 blur-3xl' />
				<div className='absolute right-0 top-1/3 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl' />
			</div>

			<div className='relative mx-auto grid max-w-7xl gap-16 px-6 py-20 lg:grid-cols-2 lg:items-center'>
				<div className='flex flex-col items-start gap-6'>
					<span className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-slate-300'>
						{lsv('heroBadge')}
					</span>

					<h1 className='max-w-xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl'>
						{lsv('heroTitle')}{' '}
						<span className='bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent'>
							{lsv('heroHighlightedTitle')}
						</span>
					</h1>

					<p className='max-w-lg text-lg text-slate-400'>{lsv('heroDescription')}</p>

					<HomeHeroActions />

					<div className='flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400'>
						{CHECKLIST.map(item => (
							<span key={lsv(item)} className='inline-flex items-center gap-1.5'>
								<span className='text-emerald-400'>✔</span> {lsv(item)}
							</span>
						))}
					</div>
				</div>

				{/* Hero illustration */}
				<div className='relative mx-auto h-[360px] w-full max-w-md sm:h-[420px]'>
					<div className='absolute inset-8 rounded-[2rem] bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-transparent blur-2xl' />
					<div className='absolute inset-10 flex items-center justify-center rounded-[2rem] border border-white/10 bg-white/5'>
						<span className='text-7xl'>🧑‍💻</span>
					</div>
					{FLOATING_CARDS.map(card => (
						<div
							key={card.labelKey}
							className={`absolute flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b0b16] px-3 py-2 text-xs font-medium text-slate-200 shadow-lg ${card.className}`}
						>
							<span>{card.emoji}</span>
							{lsv(card.labelKey)}
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
