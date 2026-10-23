'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
	createAudioGenerationJob,
	cancelAudioGenerationJob,
	getLatestStoryJob,
	retryAudioGenerationJob,
	downloadStoryAudioZip,
	getStoryAudioHistory
} from '../../../api/audio-studio/audio-generation.api';
import type { AudioGenerationJobDetails, StoryAudioHistory } from '../../../api/audio-studio/audio-generation.types';
import { apiErrorMessage } from '../../../../lib/api-error';
import { GenerationScenesTable } from './components/generation-scenes-table';
import { GenerationJobSummary } from './components/generation-job-summary';
import { RegenerationConfirmModal } from './components/regeneration-confirm-modal';

type Props = { storyId: number; allVoicesSelected: boolean; isEditing?: boolean };
const ACTIVE = ['PENDING', 'PROCESSING', 'WAITING'];

export function AudioGenerationPanel({ storyId, allVoicesSelected, isEditing = false }: Props) {
	const [job, setJob] = useState<AudioGenerationJobDetails | null>(null);
	const [audioHistory, setAudioHistory] = useState<StoryAudioHistory | null>(null);
	const [busy, setBusy] = useState(false);
	const [cancelling, setCancelling] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [syncError, setSyncError] = useState('');
	const [exporting, setExporting] = useState(false);
	const [exportError, setExportError] = useState('');
	const [showRegenerateModal, setShowRegenerateModal] = useState(false);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const requestInFlight = useRef(false);
	const epoch = useRef(0);
	const mutationInFlight = useRef(false);

	const refresh = useCallback(async () => {
		if (requestInFlight.current) return;
		requestInFlight.current = true;
		const version = epoch.current;
		try {
			const [latest, history] = await Promise.all([getLatestStoryJob(storyId), getStoryAudioHistory(storyId)]);
			if (version !== epoch.current) return;
			setJob(latest);
			setAudioHistory(history);
			setSyncError('');
		} catch (error) {
			if (version === epoch.current)
				setSyncError(apiErrorMessage(error, 'Unable to refresh generation status. Please retry.'));
		} finally {
			requestInFlight.current = false;
			if (version === epoch.current) setLoading(false);
		}
	}, [storyId]);

	useEffect(() => {
		epoch.current++;
		setJob(null);
		setAudioHistory(null);
		setLoading(true);
		setError('');
		void refresh();
		return () => {
			epoch.current++;
		};
	}, [refresh]);

	// Server state restores full jobs and single-scene jobs after tab changes,
	// reloads, and opening the story on another device. Also retry initial errors.
	useEffect(() => {
		const timer = window.setInterval(() => {
			void refresh();
		}, 3000);
		return () => window.clearInterval(timer);
	}, [refresh]);

	const active = !!job && ACTIVE.includes(job.status);
	const canMutate = !loading && !syncError && !active && !busy && !isEditing;
	const hasGeneratedAudio = (audioHistory?.generatedScenes ?? 0) > 0 || (job?.completedScenes ?? 0) > 0;
	const retryableFailedCount = job?.items?.filter(item => item.status === 'FAILED').length ?? 0;
	const canDownload =
		!!audioHistory && audioHistory.totalScenes > 0 && audioHistory.generatedScenes === audioHistory.totalScenes;

	const start = async () => {
		if (!canMutate || !allVoicesSelected || mutationInFlight.current) return;
		mutationInFlight.current = true;
		epoch.current++;
		setBusy(true);
		setError('');
		try {
			const created = await createAudioGenerationJob(storyId);
			setJob({ ...created, items: [] });
			await refresh();
		} catch (error) {
			setError(apiErrorMessage(error, 'Unable to start generation. Please refresh and try again.'));
		} finally {
			mutationInFlight.current = false;
			setBusy(false);
		}
	};

	const retry = async () => {
		if (!canMutate || !job || !['FAILED', 'PARTIAL'].includes(job.status) || mutationInFlight.current) return;
		mutationInFlight.current = true;
		epoch.current++;
		setBusy(true);
		setError('');
		try {
			const created = await retryAudioGenerationJob(job.id);
			setJob({ ...created, items: [] });
			await refresh();
		} catch (error) {
			setError(apiErrorMessage(error, 'Unable to retry failed scenes.'));
		} finally {
			mutationInFlight.current = false;
			setBusy(false);
		}
	};

	const cancel = async () => {
		if (!job || !active || mutationInFlight.current) return;
		mutationInFlight.current = true;
		epoch.current++;
		setCancelling(true);
		setError('');
		try {
			const cancelled = await cancelAudioGenerationJob(job.id);
			epoch.current++;
			setJob(cancelled);
			await refresh();
		} catch (error) {
			setError(apiErrorMessage(error, 'Unable to cancel generation. Refresh to check its status.'));
		} finally {
			mutationInFlight.current = false;
			setCancelling(false);
		}
	};

	const handleDownloadAllAudio = async () => {
		if (exporting || active || busy || !canDownload) return;
		setExporting(true);
		setExportError('');
		try {
			const blob = await downloadStoryAudioZip(storyId);
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `story-${storyId}-audio.zip`;
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.setTimeout(() => URL.revokeObjectURL(url), 1000);
		} catch (error) {
			setExportError(apiErrorMessage(error, 'Unable to download audio. Please try again.'));
		} finally {
			setExporting(false);
		}
	};

	const handleSceneJobCreated = (id: number, sceneId: number) => {
		setJob({
			id,
			storyId,
			status: 'PENDING',
			totalScenes: 1,
			completedScenes: 0,
			failedScenes: 0,
			items: [{ id: 0, sceneId, status: 'PENDING', attempts: 0, error: null, audio: null }]
		});
		void refresh();
	};

	return (
		<div
			ref={scrollContainerRef}
			className='h-full min-h-0 overflow-y-auto overscroll-contain [overflow-anchor:none]'
		>
			<section className='flex min-h-full min-w-0 flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-5'>
				<div className='flex shrink-0 flex-col gap-4'>
					<div>
						<h2 className='text-xl font-semibold text-white'>Generate Audio</h2>

						<p className='mt-1 text-sm text-slate-400'>Generate audio for the analyzed story scenes.</p>
					</div>

					<div className='grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center [&>button]:min-h-10'>
						<button
							type='button'
							onClick={() => void handleDownloadAllAudio()}
							disabled={exporting || active || busy || !canDownload}
							className='rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50'
						>
							{exporting ? 'Downloading...' : 'Download All Audio'}
						</button>

						<button
							type='button'
							onClick={() => {
								if (hasGeneratedAudio) {
									setShowRegenerateModal(true);
								} else {
									void start();
								}
							}}
							disabled={!canMutate || !allVoicesSelected}
							className='rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50'
						>
							{busy ? 'Please wait...' : active ? job?.status === 'WAITING' ? 'Waiting...' : job?.status === 'PENDING' ? 'Queued' : 'Generating...' : hasGeneratedAudio ? 'Regenerate All' : 'Generate Audio'}
						</button>

						{active && (
							<button type='button' onClick={() => void cancel()} disabled={cancelling || busy}
								className='rounded-lg border border-rose-400/40 px-4 py-2 text-sm text-rose-300 disabled:opacity-50'>
								{cancelling ? 'Cancelling...' : 'Cancel generation'}
							</button>
						)}
						{job && ['FAILED', 'PARTIAL'].includes(job.status) && retryableFailedCount > 0 && (
							<button
								type='button'
								onClick={() => void retry()}
								disabled={!canMutate}
								className='rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50'
							>
								Retry Failed ({retryableFailedCount})
							</button>
						)}

						{
							<button
								type='button'
								onClick={() => void refresh()}
								disabled={busy}
								className='rounded-lg border border-white/20 px-3 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50'
							>
								Refresh
							</button>
						}
					</div>
				</div>

				{(active || job?.status === 'CANCELLED') && (
					<p role='status' className='text-xs text-slate-400'>
						{job?.status === 'CANCELLED' ? 'Generation cancelled. Saved audio is still available.' : 'Cancel stops remaining scenes and keeps saved audio. An in-flight provider request may still be charged.'}
					</p>
				)}
				{!allVoicesSelected && (
					<p className='rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs leading-5 text-amber-300'>
						Assign and save a voice for each character in the Scenes tab before generating audio.
					</p>
				)}

				{exportError && (
					<p role='alert' className='text-sm text-red-400'>
						{exportError}
					</p>
				)}

				{syncError && (
					<p role='alert' className='text-sm text-red-400'>
						{syncError}
					</p>
				)}
				{error && (
					<p role='alert' className='text-sm text-red-400'>
						{error}
					</p>
				)}

				{loading && (
					<p role='status' className='text-sm text-slate-400'>
						Loading generation status...
					</p>
				)}
				{isEditing && (
					<p className='text-sm text-amber-300'>
						Save or cancel your script changes before generating audio.
					</p>
				)}

				{(job || audioHistory) && (
					<>
						{job && <GenerationJobSummary job={job} audioHistory={audioHistory} />}

						<GenerationScenesTable
							scrollContainerRef={scrollContainerRef}
							storyId={storyId}
							items={job?.items ?? []}
							audioHistory={audioHistory}
							sceneGeneration={null}
							generationBlocked={!canMutate || !allVoicesSelected}
							onJobCreated={handleSceneJobCreated}
						/>
					</>
				)}
			</section>

			<RegenerationConfirmModal
				open={showRegenerateModal}
				loading={busy}
				onClose={() => setShowRegenerateModal(false)}
				onConfirm={() => {
					setShowRegenerateModal(false);
					void start();
				}}
			/>
		</div>
	);
}
