'use client';

import { Fragment, useEffect, useRef, useState, type RefObject } from 'react';
import type {
	AudioGenerationJobDetails,
	AudioGenerationStatus,
	StoryAudioHistory
} from '../../../../api/audio-studio/audio-generation.types';
import { InlineSceneAudioPlayer } from './inline-scene-audio-player';
import { ScenesToolbar, type SceneStatusFilter, type SceneViewMode } from './scenes-toolbar';
import { getGeneratedAudioBlob, regenerateSingleScene } from '../../../../api/audio-studio/audio-generation.api';
import { RegenerationConfirmModal } from './regeneration-confirm-modal';

type Props = {
	scrollContainerRef: RefObject<HTMLDivElement>;
	storyId: number;
	items: AudioGenerationJobDetails['items'];
	audioHistory: StoryAudioHistory | null;
	sceneGeneration: { sceneId: number; status: AudioGenerationStatus } | null;
	onJobCreated: (jobId: number, sceneId: number) => void;
};

const PAGE_SIZE = 20;

export function GenerationScenesTable({ scrollContainerRef, storyId, items, audioHistory, sceneGeneration, onJobCreated }: Props) {
	const [expandedSceneId, setExpandedSceneId] = useState<number | null>(null);
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState<SceneStatusFilter>('ALL');
	const [viewMode, setViewMode] = useState<SceneViewMode>('INFINITE');
	const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
	const [currentPage, setCurrentPage] = useState(1);
	const [voice, setVoice] = useState('ALL');

	const [regenerateScene, setRegenerateScene] = useState<{
		sceneId: number;
		sceneNumber: number;
	} | null>(null);

	const [regenerating, setRegenerating] = useState(false);

	const lastScrollTopRef = useRef(0);
	const autoPageLockedRef = useRef(false);

	// Match job items with their corresponding scene history.
	const historyBySceneId = new Map((audioHistory?.scenes ?? []).map(scene => [scene.id, scene]));

	const voices = Array.from(
		new Set(
			(audioHistory?.scenes ?? [])
				.map(scene => scene.latestAudio?.voice.name)
				.filter((name): name is string => Boolean(name))
		)
	).sort();

	// A retry job contains only retried scenes. The full story history is the
	// authoritative list of rows; current job items supply live status only.
	const itemsBySceneId = new Map(items.map(item => [item.sceneId, item]));
	const rows = audioHistory
		? audioHistory.scenes.map(sceneHistory => ({
				item: itemsBySceneId.get(sceneHistory.id),
				sceneId: sceneHistory.id,
				sceneNumber: sceneHistory.sceneOrder,
				sceneHistory
			}))
		: items.map((item, index) => ({
				item,
				sceneId: item.sceneId,
				sceneNumber: index + 1,
				sceneHistory: historyBySceneId.get(item.sceneId)
			}));

	const getDisplayStatus = (sceneId: number, item: (typeof items)[number] | undefined, hasAudio: boolean) => {
		if (
			sceneGeneration?.sceneId === sceneId &&
			['PENDING', 'PROCESSING', 'WAITING'].includes(sceneGeneration.status)
		) {
			return sceneGeneration.status;
		}

		if (hasAudio) return 'COMPLETED';

		if (sceneGeneration?.sceneId === sceneId) {
			return sceneGeneration.status;
		}

		return item?.status ?? '—';
	};

	const filteredItems = rows.filter(({ item, sceneId, sceneNumber, sceneHistory }) => {
		const query = search.trim().toLowerCase();

		const searchableText = [
			String(sceneId),
			String(sceneNumber),
			sceneHistory?.text,
			sceneHistory?.speakerName,
			sceneHistory?.latestAudio?.voice.name
		]
			.filter((value): value is string => typeof value === 'string')
			.join(' ')
			.toLowerCase();

		const matchesSearch = !query || searchableText.includes(query);

		const displayStatus = getDisplayStatus(sceneId, item, Boolean(sceneHistory?.latestAudio));

		const matchesStatus = status === 'ALL' || displayStatus === status;

		const matchesVoice = voice === 'ALL' || sceneHistory?.latestAudio?.voice.name === voice;

		return matchesSearch && matchesStatus && matchesVoice;
	});

	const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));

	const safePage = Math.min(currentPage, totalPages);

	const visibleItems =
		viewMode === 'INFINITE'
			? filteredItems.slice(0, visibleCount)
			: filteredItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

	const changePage = (page: number) => {
		const nextPage = Math.max(1, Math.min(page, totalPages));

		setCurrentPage(nextPage);
		setExpandedSceneId(null);
		autoPageLockedRef.current = true;
		lastScrollTopRef.current = 0;

		scrollContainerRef.current?.scrollTo({
			top: 0,
			behavior: 'instant'
		});
	};

	const handleDownloadAudio = async (audioId: number, sceneId: number) => {
		try {
			const blob = await getGeneratedAudioBlob(audioId);

			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');

			link.href = url;
			link.download = `scene-${sceneId}.wav`;

			document.body.appendChild(link);
			link.click();
			link.remove();

			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Audio download failed:', error);
			alert('Unable to download audio.');
		}
	};
	const handleConfirmRegenerate = async () => {
		if (
			!regenerateScene ||
			regenerating ||
			(sceneGeneration && ['PENDING', 'PROCESSING', 'WAITING'].includes(sceneGeneration.status))
		)
			return;

		setRegenerating(true);

		try {
			const job = await regenerateSingleScene(storyId, regenerateScene.sceneId);

			setRegenerateScene(null);
			onJobCreated(job.id, regenerateScene.sceneId);
		} catch (error) {
			console.error('Scene regeneration failed:', error);
			alert('Unable to regenerate scene.');
		} finally {
			setRegenerating(false);
		}
	};

	useEffect(() => {
		setVisibleCount(PAGE_SIZE);
		setCurrentPage(1);
		setExpandedSceneId(null);

		lastScrollTopRef.current = 0;
		autoPageLockedRef.current = false;

		scrollContainerRef.current?.scrollTo({ top: 0 });
	}, [search, status, voice, viewMode, scrollContainerRef]);

	const handleScroll = () => {
		const element = scrollContainerRef.current;
		if (!element) return;

		const scrollTop = element.scrollTop;
		const previousScrollTop = lastScrollTopRef.current;

		const scrollingDown = scrollTop > previousScrollTop;
		const scrollingUp = scrollTop < previousScrollTop;

		lastScrollTopRef.current = scrollTop;

		const nearBottom = scrollTop + element.clientHeight >= element.scrollHeight - 40;

		const hasScrollableContent = element.scrollHeight > element.clientHeight;

		if (viewMode === 'INFINITE') {
			if (scrollingDown && nearBottom && visibleCount < filteredItems.length) {
				setVisibleCount(count => Math.min(count + PAGE_SIZE, filteredItems.length));
			}

			return;
		}

		if (!hasScrollableContent) return;

		if (autoPageLockedRef.current) {
			if (scrollTop > 80) {
				autoPageLockedRef.current = false;
			}
			return;
		}

		if (scrollingDown && nearBottom && safePage < totalPages) {
			changePage(safePage + 1);
		} else if (scrollingUp && scrollTop <= 0 && safePage > 1) {
			changePage(safePage - 1);
		}
	};

	// The generation panel owns scrolling, including its controls and summary.
	// Keeping one scroll container prevents nested scroll positions hiding them.
	useEffect(() => {
		const element = scrollContainerRef.current;
		if (!element) return;
		element.addEventListener('scroll', handleScroll, { passive: true });
		return () => element.removeEventListener('scroll', handleScroll);
	});

	return (
		<div className='flex min-w-0 flex-col gap-3'>
			<div className='flex flex-wrap items-center justify-between gap-2'>
				<h3 className='font-semibold text-white'>Scenes</h3>

				<span className='text-xs text-slate-400'>
					Showing {visibleItems.length} of {filteredItems.length}
					{filteredItems.length !== rows.length && ` (Total: ${rows.length})`}
				</span>
			</div>

			<ScenesToolbar
				search={search}
				onSearchChange={setSearch}
				status={status}
				onStatusChange={setStatus}
				voices={voices}
				voice={voice}
				onVoiceChange={setVoice}
				viewMode={viewMode}
				onViewModeChange={setViewMode}
			/>

			<div className='rounded-xl border border-white/10'>
				<div>
					<table className='generation-scenes-table w-full table-fixed text-left text-sm'>
						<colgroup>
							<col style={{ width: '26%' }} />
							<col style={{ width: '10%' }} />
							<col style={{ width: '10%' }} />
							<col style={{ width: '12%' }} />
							<col style={{ width: '10%' }} />
							<col style={{ width: '32%' }} />
						</colgroup>
						<thead className='sticky top-0 z-10 bg-slate-900 text-slate-400'>
							<tr>
								<th className='px-4 py-3'>Scene</th>
								<th className='px-4 py-3'>Voice</th>
								<th className='px-4 py-3'>Duration</th>
								<th className='px-4 py-3'>Status</th>
								<th className='px-4 py-3'>Attempts</th>
								<th className='px-4 py-3 text-right'>Action</th>
							</tr>
						</thead>

						<tbody className='divide-y divide-white/10'>
							{visibleItems.map(({ item, sceneId, sceneNumber, sceneHistory }) => {
								const displayStatus = getDisplayStatus(
									sceneId,
									item,
									Boolean(sceneHistory?.latestAudio)
								);
								const latestAudioId = sceneHistory?.latestAudio?.id ?? item?.audio?.id;
								const isSceneBusy =
									sceneGeneration !== null &&
									['PENDING', 'PROCESSING', 'WAITING'].includes(sceneGeneration.status);

								return (
									<Fragment key={sceneId}>
										<tr className='hover:bg-white/[0.04]'>
											{/* Scene, speaker and dialogue */}
											<td className='max-w-[360px] px-4 py-3'>
												<div className='font-medium text-white'>
													Scene {sceneHistory?.sceneOrder ?? sceneNumber}
													{sceneHistory?.speakerName && (
														<span className='ml-2 text-xs text-indigo-300'>
															{sceneHistory.speakerName}
														</span>
													)}
												</div>

												{sceneHistory?.text && (
													<p
														className='mt-1 line-clamp-2 break-words text-xs leading-5 text-slate-400'
														title={sceneHistory.text}
													>
														{sceneHistory.text}
													</p>
												)}
											</td>

											<td data-label='Voice' className='px-4 py-3 text-sm text-slate-300'>
												{sceneHistory?.latestAudio?.voice.name ?? '—'}
											</td>

											<td data-label='Duration' className='px-4 py-3 text-sm text-slate-300'>
												{(() => {
													const durationMs =
														sceneHistory?.latestAudio?.durationMs ??
														item?.audio?.durationMs;

													if (durationMs == null) return '—';

													const totalSeconds = Math.floor(durationMs / 1000);
													const minutes = Math.floor(totalSeconds / 60);
													const seconds = totalSeconds % 60;

													return `${minutes}:${String(seconds).padStart(2, '0')}`;
												})()}
											</td>

											{/* Status */}
											<td data-label='Status' className='px-4 py-3'>
												<span
													className={
														displayStatus === 'COMPLETED'
															? 'text-emerald-400'
															: displayStatus === 'FAILED'
																? 'text-red-400'
																: 'text-amber-400'
													}
												>
													{displayStatus}
												</span>
											</td>

											{/* Attempts */}
											<td data-label='Attempts' className='px-4 py-3 text-slate-300'>{item?.attempts ?? '—'}</td>

											{/* Audio player toggle */}
											<td className='px-4 py-3'>
												<div className='flex flex-wrap items-center justify-end gap-2'>
													{latestAudioId != null && (
														<>
															<div
																className={expandedSceneId === sceneId ? 'order-last w-full min-w-0 overflow-hidden' : 'hidden'}
																aria-live='off'
															>
																{expandedSceneId === sceneId && (
																	<InlineSceneAudioPlayer audioId={latestAudioId} />
																)}
															</div>
															<button
																type='button'
																onClick={() =>
																	setExpandedSceneId(
																		expandedSceneId === sceneId ? null : sceneId
																	)
																}
																aria-expanded={expandedSceneId === sceneId}
																className='rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white hover:bg-white/10'
															>
																{expandedSceneId === sceneId ? 'Close' : 'Play'}
															</button>

															<button
																type='button'
																onClick={() =>
																	void handleDownloadAudio(latestAudioId!, sceneId)
																}
																className='rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white hover:bg-white/10'
															>
																Download
															</button>
														</>
													)}
													<button
														type='button'
														onClick={() =>
															setRegenerateScene({
																sceneId,
																sceneNumber
															})
														}
														disabled={regenerating || isSceneBusy}
														className='rounded-lg border border-indigo-500/30 px-3 py-1.5 text-xs text-indigo-300 hover:bg-indigo-500/10 disabled:opacity-50'
													>
														Regenerate
													</button>
												</div>
											</td>
										</tr>

										{displayStatus === 'FAILED' && !sceneHistory?.latestAudio && item?.error && (
											<tr>
												<td colSpan={6} className='break-words px-4 pb-3 text-xs text-red-400'>
													{item.error}
												</td>
											</tr>
										)}
									</Fragment>
								);
							})}

							{filteredItems.length === 0 && (
								<tr>
									<td colSpan={6} className='px-4 py-8 text-center text-sm text-slate-400'>
										No matching scenes found.
									</td>
								</tr>
							)}
						</tbody>
					</table>

					{viewMode === 'INFINITE' && visibleCount < filteredItems.length && (
						<div className='py-3 text-center text-xs text-slate-400'>Scroll down to load more scenes</div>
					)}
				</div>

				{viewMode === 'PAGINATION' && (
					<div className='flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3'>
						<button
							type='button'
							onClick={() => changePage(safePage - 1)}
							disabled={safePage === 1}
							className='rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white disabled:cursor-not-allowed disabled:opacity-40'
						>
							Previous
						</button>

						<span className='text-xs text-slate-400'>
							Page {safePage} of {totalPages}
						</span>

						<button
							type='button'
							onClick={() => changePage(safePage + 1)}
							disabled={safePage >= totalPages}
							className='rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white disabled:cursor-not-allowed disabled:opacity-40'
						>
							Next
						</button>
					</div>
				)}
			</div>
			<RegenerationConfirmModal
				open={regenerateScene !== null}
				sceneNumber={regenerateScene?.sceneNumber}
				loading={regenerating}
				onConfirm={() => void handleConfirmRegenerate()}
				onClose={() => setRegenerateScene(null)}
			/>
		</div>
	);
}
