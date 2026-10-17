import { LinkButton } from '@/src/components/ui/button';
export function AudioStudioHero() {
	return (
		<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
			<div>
				<p className='mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-400'>YOUR WORKSPACE</p>

				<h1 className='text-3xl font-bold tracking-tight text-white'>Audio Studio</h1>

				<p className='mt-2 text-sm text-slate-400'>Create, organize and generate audio from your stories.</p>
			</div>

			<LinkButton
				href='/audio/create'
				variant='primary'
				size='md'
				className='w-fit gap-2 rounded-xl px-5 py-3 font-semibold'
			>
				<span className='text-lg leading-none'>+</span>
				Create Audio
			</LinkButton>
		</div>
	);
}
