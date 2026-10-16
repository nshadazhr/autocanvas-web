'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AudioStoryCharacter, AudioStoryScene } from '../../../../api/audio-studio/audio-stories.types';
import { ProjectCast } from '../../project-cast';

type Props = { storyId: number; scenes: AudioStoryScene[]; characters: AudioStoryCharacter[] };

export function ScenesPanel({ storyId, scenes, characters }: Props) {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [search, setSearch] = useState('');
	const [speaker, setSpeaker] = useState('');
	const [emotion, setEmotion] = useState('');
	const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
	const [needsExpand, setNeedsExpand] = useState<Set<number>>(() => new Set());
	const sorted = useMemo(() => [...scenes].sort((a, b) => a.sceneOrder - b.sceneOrder), [scenes]);
	const speakers = useMemo(() => [...new Set(scenes.map(s => s.speakerName))].sort(), [scenes]);
	const emotions = useMemo(() => [...new Set(scenes.map(s => s.emotion))].sort(), [scenes]);
	const filtered = useMemo(
		() =>
			sorted.filter(
				s =>
					(!speaker || s.speakerName === speaker) &&
					(!emotion || s.emotion === emotion) &&
					(!search ||
						`${s.sceneOrder} ${s.speakerName} ${s.text} ${s.style} ${s.emotion}`
							.toLocaleLowerCase()
							.includes(search.toLocaleLowerCase()))
			),
		[sorted, speaker, emotion, search]
	);

	useEffect(() => {
		if (!drawerOpen) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setDrawerOpen(false);
		};
		window.addEventListener('keydown', onKeyDown);
		const oldOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			window.removeEventListener('keydown', onKeyDown);
			document.body.style.overflow = oldOverflow;
		};
	}, [drawerOpen]);

	const fieldClass =
		'min-w-0 rounded-lg border border-white/10 bg-[#121a2c] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-400';
	return (
		<>
			<section className='flex h-[calc(100dvh-340px)] min-h-[350px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-5'>
				<div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
					<div>
						<h2 className='text-lg font-semibold text-white'>Scenes ({scenes.length})</h2>
						<p className='text-xs text-slate-400'>Review analyzed scenes and dialogue</p>
					</div>
					<button
						type='button'
						onClick={() => setDrawerOpen(true)}
						className='rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500'
					>
						Manage Voices ({characters.length})
					</button>
				</div>
				<div className='mb-4 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(130px,180px)_minmax(130px,180px)]'>
					<input
						value={search}
						onChange={e => setSearch(e.target.value)}
						placeholder='Search scenes or dialogue...'
						aria-label='Search scenes'
						className={fieldClass}
					/>
					<select
						value={speaker}
						onChange={e => setSpeaker(e.target.value)}
						aria-label='Filter by character'
						className={fieldClass}
					>
						<option value=''>All Characters</option>
						{speakers.map(s => (
							<option key={s} value={s}>
								{s}
							</option>
						))}
					</select>
					<select
						value={emotion}
						onChange={e => setEmotion(e.target.value)}
						aria-label='Filter by emotion'
						className={fieldClass}
					>
						<option value=''>All Emotions</option>
						{emotions.map(e => (
							<option key={e} value={e}>
								{e}
							</option>
						))}
					</select>
				</div>
				<div className='min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1 sm:pr-2'>
					{filtered.length === 0 && (
						<p className='py-8 text-center text-sm text-slate-400'>No matching scenes.</p>
					)}
					{filtered.map(scene => {
						const isExpanded = expanded.has(scene.sceneOrder);
						return (
							<article
								key={scene.sceneOrder}
								className='rounded-xl border border-[#2b3854] bg-[#151e30] p-3 sm:p-4'
							>
								<div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
									<div className='flex items-center gap-2.5'>
										<span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white'>
											{String(scene.sceneOrder).padStart(2, '0')}
										</span>
										<h3 className='text-sm font-semibold text-white'>Scene {scene.sceneOrder}</h3>
									</div>
									<span className='max-w-full break-words rounded-full bg-indigo-500/15 px-3 py-1 text-xs text-indigo-200'>
										{scene.speakerName}
									</span>
								</div>
								<div className='mb-3 flex flex-wrap gap-2 text-xs'>
									<span className='rounded-full bg-violet-500/10 px-2.5 py-1 text-violet-300'>
										Emotion: {scene.emotion}
									</span>
									<span className='rounded-full bg-rose-500/10 px-2.5 py-1 text-rose-300'>
										Style: {scene.style}
									</span>
									<span className='rounded-full bg-sky-500/10 px-2.5 py-1 text-sky-300'>
										Language: {scene.language}
									</span>
								</div>
								<div className='border-l-2 border-indigo-500 pl-3'>
									<p
										ref={element => {
											if (!element || isExpanded || needsExpand.has(scene.sceneOrder)) return;
											if (element.scrollHeight > element.clientHeight + 2)
												setNeedsExpand(prev => new Set(prev).add(scene.sceneOrder));
										}}
										className={`whitespace-pre-wrap break-words text-sm leading-7 text-slate-200 ${isExpanded ? '' : 'line-clamp-4'}`}
									>
										{scene.text}
									</p>
									{(needsExpand.has(scene.sceneOrder) || isExpanded) && (
										<button
											type='button'
											onClick={() =>
												setExpanded(prev => {
													const next = new Set(prev);
													next.has(scene.sceneOrder)
														? next.delete(scene.sceneOrder)
														: next.add(scene.sceneOrder);
													return next;
												})
											}
											className='mt-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300'
										>
											{isExpanded ? 'Show Less ↑' : 'Show More ↓'}
										</button>
									)}
								</div>
							</article>
						);
					})}
				</div>
				<p className='mt-2 text-right text-xs text-slate-500'>
					Showing {filtered.length} of {scenes.length} scenes
				</p>
			</section>
			{drawerOpen && (
				<div className='fixed inset-0 z-[100] flex justify-end' role='presentation'>
					<button
						type='button'
						className='absolute inset-0 bg-black/70'
						aria-label='Close voice manager'
						onClick={() => setDrawerOpen(false)}
					/>
					<aside
						role='dialog'
						aria-modal='true'
						aria-labelledby='voices-drawer-title'
						className='relative flex h-full w-full max-w-[430px] flex-col border-l border-white/10 bg-[#101827] shadow-2xl sm:w-[430px]'
					>
						<div className='flex shrink-0 items-start justify-between border-b border-white/10 p-4 sm:p-5'>
							<div>
								<h2 id='voices-drawer-title' className='text-lg font-semibold text-white'>
									Manage Voices
								</h2>
								<p className='mt-1 text-xs text-slate-400'>{characters.length} detected characters</p>
							</div>
							<button
								type='button'
								onClick={() => setDrawerOpen(false)}
								aria-label='Close Manage Voices'
								className='rounded-lg border border-white/10 px-3 py-1.5 text-slate-200 hover:bg-white/10'
							>
								✕
							</button>
						</div>
						<div className='min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4'>
							<p className='mb-3 rounded-lg border border-indigo-400/15 bg-indigo-500/10 p-3 text-xs text-slate-300'>
								A character's saved voice is used across all their scenes.
							</p>
							<ProjectCast storyId={storyId} characters={characters} compact />
						</div>
					</aside>
				</div>
			)}
		</>
	);
}
