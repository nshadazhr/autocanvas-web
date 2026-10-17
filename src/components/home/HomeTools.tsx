import { getStrings } from '../../lib/appResolvers';
import { TOOLS } from './homeData';

export default function HomeTools() {
	const lsv = getStrings();
	return (
		<section id='tools' className='mx-auto max-w-6xl px-6 pb-16'>
			<div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
				{TOOLS.map(tool => (
					<div
						key={tool.titleKey}
						className='rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.06]'
					>
						<span className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-lg ${tool.tint}`}>
							{tool.emoji}
						</span>
						<h3 className='text-sm font-semibold text-white'>{lsv(tool.titleKey)}</h3>
						<p className='mt-1 text-xs text-slate-400'>{lsv(tool.descriptionKey)}</p>
					</div>
				))}
			</div>
		</section>
	);
}
