import { getStrings } from '../../lib/appResolvers';
import { STATS } from './homeData';

export default function HomeStats() {
	const lsv = getStrings();
	return (
		<section className='mx-auto max-w-5xl border-t border-white/10 px-6 py-12'>
			<div className='grid grid-cols-2 gap-8 sm:grid-cols-4'>
				{STATS.map(stat => (
					<div key={stat.labelKey} className='flex items-center gap-3'>
						<span className='text-2xl'>{stat.emoji}</span>
						<div className='flex flex-col leading-tight'>
							<span className='text-lg font-bold text-white'>{lsv(stat.valueKey)}</span>
							<span className='text-xs text-slate-400'>{lsv(stat.labelKey)}</span>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
