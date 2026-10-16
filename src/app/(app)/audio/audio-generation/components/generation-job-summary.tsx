'use client';

import type { AudioGenerationJobDetails, StoryAudioHistory } from '../../../../api/audio-studio/audio-generation.types';

type Props = {
	job: AudioGenerationJobDetails;
	audioHistory: StoryAudioHistory | null;
};

const statusStyles: Record<string, string> = {
	COMPLETED: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
	FAILED: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
	PARTIAL: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
	PROCESSING: 'border-sky-400/20 bg-sky-400/10 text-sky-300',
	PENDING: 'border-slate-400/20 bg-slate-400/10 text-slate-300',
	WAITING: 'border-amber-400/20 bg-amber-400/10 text-amber-300'
};

function Stat({ label, value, color, dot }: { label: string; value: number; color: string; dot: string }) {
	return (
		<div className='flex min-w-[120px] flex-1 items-center gap-2.5 rounded-lg border border-white/[0.07] bg-white/[0.035] px-3 py-2.5'>
			<span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
			<span className={`text-xl font-semibold tabular-nums leading-none ${color}`}>{value}</span>
			<span className='text-xs font-medium text-slate-400'>{label}</span>
		</div>
	);
}

export function GenerationJobSummary({ job, audioHistory }: Props) {
	const total = audioHistory?.totalScenes ?? job.totalScenes;
	const completed = audioHistory
		? audioHistory.scenes.filter(scene => scene.latestAudio !== null).length
		: job.completedScenes;
	const failed = audioHistory
		? audioHistory.scenes.filter(
				scene =>
					!scene.latestAudio && job.items.some(item => item.sceneId === scene.id && item.status === 'FAILED')
			).length
		: job.failedScenes;
	const processed = Math.min(total, completed + failed);
	const pending = Math.max(0, total - processed);
	const percent = total > 0 ? Math.round((processed / total) * 100) : 0;
	const active = ['PENDING', 'PROCESSING', 'WAITING'].includes(job.status);
	const status =
		!active && total > 0 && completed === total
			? 'COMPLETED'
			: !active && failed > 0 && completed > 0
				? 'PARTIAL'
				: !active && failed > 0 && completed === 0 && pending === 0
					? 'FAILED'
					: job.status;
	const statusLabel = status === 'PARTIAL' ? 'PARTIALLY COMPLETED' : status.replace(/_/g, ' ');

	return (
		<section
			aria-label='Story audio generation summary'
			className='rounded-xl border border-[#253149] bg-[#111a2b] px-3 py-3 sm:px-4'
		>
			<div className='flex items-center gap-3 overflow-x-auto pb-1 lg:overflow-visible lg:pb-0'>
				<div className='flex min-w-[195px] shrink-0 items-center gap-2.5 border-r border-white/10 pr-3'>
					<span className='text-sm font-semibold whitespace-nowrap text-white'>Job #{job.id}</span>
					<span
						className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-semibold ${statusStyles[status] ?? statusStyles.PENDING}`}
					>
						<span className='h-1.5 w-1.5 rounded-full bg-current' />
						{statusLabel}
					</span>
				</div>
				<Stat label='Completed' value={completed} color='text-emerald-400' dot='bg-emerald-400' />
				<Stat label='Failed' value={failed} color='text-rose-400' dot='bg-rose-400' />
				<Stat label='Pending' value={pending} color='text-sky-400' dot='bg-sky-400' />
				<div className='flex min-w-[195px] flex-1 items-center gap-3 rounded-lg border border-indigo-400/15 bg-indigo-400/[0.06] px-3 py-2'>
					<div
						className='relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full'
						style={{ background: `conic-gradient(#818cf8 ${percent}%, #293349 ${percent}% 100%)` }}
					>
						<div className='flex h-[35px] w-[35px] items-center justify-center rounded-full bg-[#172139] text-[11px] font-bold text-white'>
							{percent}%
						</div>
					</div>
					<div className='min-w-0'>
						<p className='text-xs font-semibold text-slate-100'>Progress</p>
						<p className='whitespace-nowrap text-[11px] text-slate-400'>
							{processed} / {total} processed
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
