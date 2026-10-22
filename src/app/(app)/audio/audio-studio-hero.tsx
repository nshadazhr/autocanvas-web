import { LinkButton } from '@/src/components/ui/button';

export function AudioStudioHero() {
	return (
		<div className='flex min-w-0 flex-row items-center justify-between gap-2 sm:gap-4'>
			<div className='min-w-0 flex-1'>
				<p className='mb-1 hidden text-xs font-semibold uppercase tracking-widest text-indigo-400 sm:block'>
					YOUR WORKSPACE
				</p>

				<h1 className='text-xl font-bold tracking-tight text-white sm:text-3xl'>Audio Studio</h1>

				<p className='mt-2 hidden text-sm text-slate-400 sm:block'>
					Create, organize and generate audio from your stories.
				</p>
			</div>

			<LinkButton
				href='/audio/create'
				variant='primary'
				size='md'
				className='ml-auto w-fit shrink-0 gap-1 rounded-xl px-3 py-2 text-xs font-semibold sm:gap-2 sm:px-5 sm:py-3 sm:text-sm'
			>
				<span className='text-base leading-none sm:text-lg'>+</span>
				Create Audio
			</LinkButton>
		</div>
	);
}
