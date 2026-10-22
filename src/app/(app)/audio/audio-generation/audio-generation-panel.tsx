'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
	createAudioGenerationJob,
	getAudioGenerationJob,
	retryAudioGenerationJob,
	downloadStoryAudioZip,
	getStoryAudioHistory
} from '../../../api/audio-studio/audio-generation.api';

import type {
	AudioGenerationJobDetails,
	AudioGenerationStatus,
	StoryAudioHistory
} from '../../../api/audio-studio/audio-generation.types';

import { GenerationScenesTable } from './components/generation-scenes-table';
import { GenerationJobSummary } from './components/generation-job-summary';
import { RegenerationConfirmModal } from './components/regeneration-confirm-modal';

type Props = {
	storyId: number;
	allVoicesSelected: boolean;
};
type SceneGeneration = {
	sceneId: number;
	status: AudioGenerationStatus;
};

const ACTIVE: AudioGenerationStatus[] = ['PENDING', 'PROCESSING', 'WAITING'];

export function AudioGenerationPanel({ storyId, allVoicesSelected }: Props) {
	const [job, setJob] = useState<AudioGenerationJobDetails | null>(null);
	const [jobId, setJobId] = useState<number | null>(null);

	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');

	const [exporting, setExporting] = useState(false);
	const [exportError, setExportError] = useState('');

	const [showRegenerateModal, setShowRegenerateModal] = useState(false);

	const [audioHistory, setAudioHistory] = useState<StoryAudioHistory | null>(null);

	const [sceneJobId, setSceneJobId] = useState<number | null>(null);

	const [sceneGeneration, setSceneGeneration] = useState<SceneGeneration | null>(null);

	const requestInFlight = useRef(false);

	// Restore the last known main job.
	useEffect(() => {
		setJob(null);
		setError('');
		setAudioHistory(null);
		setSceneJobId(null);
		setSceneGeneration(null);
		setShowRegenerateModal(false);

		const stored = window.localStorage.getItem(`autocanvas:audio-job:${storyId}`);

		const parsed = stored === null ? NaN : Number(stored);

		setJobId(Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null);
	}, [storyId]);

	// Refresh main generation job.
	const refresh = useCallback(async (id: number) => {
		if (requestInFlight.current) return;

		requestInFlight.current = true;

		try {
			const data = await getAudioGenerationJob(id);

			setJob(data);
			setError('');
		} catch (error) {
			console.error('Failed to load generation job:', error);

			setError('Unable to load generation status. Please try again.');
		} finally {
			requestInFlight.current = false;
		}
	}, []);

	// Load latest generated audio for all story scenes.
	const loadAudioHistory = useCallback(async () => {
		try {
			const data = await getStoryAudioHistory(storyId);
			setAudioHistory(data);
		} catch (error) {
			console.error('Failed to load audio history:', error);
		}
	}, [storyId]);

	// Initial audio history and main job status changes.
	useEffect(() => {
		void loadAudioHistory();
	}, [loadAudioHistory, job?.id, job?.status, job?.completedScenes, job?.failedScenes]);

	// Fetch main job when jobId changes.
	useEffect(() => {
		if (jobId === null) return;

		void refresh(jobId);
	}, [jobId, refresh]);

	// Main job polling.
	useEffect(() => {
		if (jobId === null || (job && !ACTIVE.includes(job.status))) {
			return;
		}

		const timer = window.setInterval(() => {
			void refresh(jobId);
		}, 3000);

		return () => {
			window.clearInterval(timer);
		};
	}, [jobId, job?.status, refresh]);

	// Single-scene regeneration polling.
	// Does not replace the main job or its scenes table.
	useEffect(() => {
		if (sceneJobId === null) return;

		let cancelled = false;
		let timer: ReturnType<typeof setTimeout> | null = null;

		const checkSceneJob = async () => {
			try {
				const result = await getAudioGenerationJob(sceneJobId);

				if (cancelled) return;

				const sceneItem = result.items[0];

				if (sceneItem) {
					setSceneGeneration({
						sceneId: sceneItem.sceneId,
						status: sceneItem.status
					});
				}

				if (ACTIVE.includes(result.status)) {
					timer = setTimeout(() => {
						void checkSceneJob();
					}, 3000);

					return;
				}

				// Generation finished: reload latest audio versions.
				await loadAudioHistory();

				if (!cancelled) {
					setSceneJobId(null);

					// Keep the final status available to the table.
					if (sceneItem) {
						setSceneGeneration({
							sceneId: sceneItem.sceneId,
							status: sceneItem.status
						});
					}
				}
			} catch (error) {
				console.error('Unable to refresh scene generation:', error);

				if (!cancelled) {
					timer = setTimeout(() => {
						void checkSceneJob();
					}, 5000);
				}
			}
		};

		void checkSceneJob();

		return () => {
			cancelled = true;

			if (timer !== null) {
				clearTimeout(timer);
			}
		};
	}, [sceneJobId, loadAudioHistory]);

	const active = job ? ACTIVE.includes(job.status) : jobId !== null;

	const sceneActive = sceneJobId !== null || (sceneGeneration !== null && ACTIVE.includes(sceneGeneration.status));

	// Generate / Regenerate all scenes.
	const start = async () => {
		if (busy || active || sceneActive || !allVoicesSelected) return;
		setBusy(true);
		setError('');

		try {
			const created = await createAudioGenerationJob(storyId);

			window.localStorage.setItem(`autocanvas:audio-job:${storyId}`, String(created.id));

			setJobId(created.id);
			setJob(null);
			setSceneGeneration(null);

			await refresh(created.id);
		} catch (error) {
			console.error('Unable to start audio generation:', error);

			setError('Unable to start audio generation. Check scene voice assignments and try again.');
		} finally {
			setBusy(false);
		}
	};

	// Retry failed scenes using existing backend job retry.
	const retry = async () => {
		if (busy || sceneActive || !job || !['FAILED', 'PARTIAL'].includes(job.status)) {
			return;
		}

		setBusy(true);
		setError('');

		try {
			const updated = await retryAudioGenerationJob(job.id);

			window.localStorage.setItem(`autocanvas:audio-job:${storyId}`, String(updated.id));

			setJobId(updated.id);
			setJob(null);
			setSceneGeneration(null);

			await refresh(updated.id);
		} catch (error) {
			console.error('Unable to retry failed scenes:', error);

			setError('Unable to retry failed scenes. Please try again.');
		} finally {
			setBusy(false);
		}
	};

	// Download all latest scene WAV files as ZIP.
	const handleDownloadAllAudio = async () => {
		if (exporting || active || busy || sceneActive) return;

		setExporting(true);
		setExportError('');

		try {
			const blob = await downloadStoryAudioZip(storyId);
			const url = URL.createObjectURL(blob);

			try {
				const link = document.createElement('a');

				link.href = url;
				link.download = `story-${storyId}-audio.zip`;

				document.body.appendChild(link);
				link.click();
				link.remove();
			} finally {
				window.setTimeout(() => {
					URL.revokeObjectURL(url);
				}, 1000);
			}
		} catch (error) {
			console.error('Audio ZIP download failed:', error);

			setExportError('Unable to download audio. Make sure all scenes have generated audio.');
		} finally {
			setExporting(false);
		}
	};

	// Single-scene job callback.
	const handleSceneJobCreated = (newJobId: number, sceneId: number) => {
		setSceneGeneration({
			sceneId,
			status: 'PENDING'
		});

		// Main jobId remains unchanged.
		setSceneJobId(newJobId);
	};

	const retryableFailedCount =
		job?.items.filter(item => {
			if (item.status !== 'FAILED') return false;

			const sceneHistory = audioHistory?.scenes.find(scene => scene.id === item.sceneId);

			return !sceneHistory?.latestAudio;
		}).length ?? 0;

	return (
		<>
			<section className='space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6'>
				<div className='flex flex-wrap items-center justify-between gap-4'>
					<div>
						<h2 className='text-xl font-semibold text-white'>Generate Audio</h2>

						<p className='mt-1 text-sm text-slate-400'>Generate audio for the analyzed story scenes.</p>
					</div>

					<div className='flex flex-wrap items-center gap-2'>
						<button
							type='button'
							onClick={() => void handleDownloadAllAudio()}
							disabled={exporting || active || busy || sceneActive}
							className='rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50'
						>
							{exporting ? 'Downloading...' : 'Download All Audio'}
						</button>

						<button
							type='button'
							onClick={() => {
								if (job) {
									setShowRegenerateModal(true);
								} else {
									void start();
								}
							}}
							disabled={busy || active || sceneActive || !allVoicesSelected}
							className='rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50'
						>
							{busy ? 'Please wait...' : job ? 'Regenerate All' : 'Generate Audio'}
						</button>

						{!allVoicesSelected && (
							<p className='text-xs text-amber-400'>
								Please assign and save voices for all characters before generating audio.
							</p>
						)}

						{job && ['FAILED', 'PARTIAL'].includes(job.status) && retryableFailedCount > 0 && (
							<button
								type='button'
								onClick={() => void retry()}
								disabled={busy || sceneActive}
								className='rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50'
							>
								Retry Failed ({retryableFailedCount})
							</button>
						)}

						{jobId !== null && (
							<button
								type='button'
								onClick={() => void refresh(jobId)}
								disabled={busy}
								className='rounded-lg border border-white/20 px-3 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50'
							>
								Refresh
							</button>
						)}
					</div>
				</div>

				{exportError && (
					<p role='alert' className='text-sm text-red-400'>
						{exportError}
					</p>
				)}

				{error && (
					<p role='alert' className='text-sm text-red-400'>
						{error}
					</p>
				)}

				{jobId !== null && !job && <p className='text-sm text-slate-400'>Loading generation job...</p>}

				{job && (
					<>
						<GenerationJobSummary job={job} audioHistory={audioHistory} />

						<GenerationScenesTable
							storyId={storyId}
							items={job.items}
							audioHistory={audioHistory}
							sceneGeneration={sceneGeneration}
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
		</>
	);
}
