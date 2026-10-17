import { getStrings } from '../../lib/appResolvers';
const lsv = getStrings();
import { CHANNELS } from './homeData';

export default function HomeChannels() {
	return (
		<section className='mx-auto max-w-5xl px-6 pb-16'>
			<p className='mb-8 text-center text-sm text-slate-500'>{lsv('channelsHeading')}</p>
			<div className='grid grid-cols-3 gap-6 sm:grid-cols-6'>
				{CHANNELS.map(channel => (
					<div key={channel.nameKey} className='flex flex-col items-center gap-2 text-center'>
						<span className='flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-xl'>
							{channel.emoji}
						</span>
						<span className='text-sm font-medium text-white'>{lsv(channel.nameKey)}</span>
						<span className='text-xs text-slate-500'>{lsv(channel.viewsKey)}</span>
					</div>
				))}
			</div>
		</section>
	);
}
