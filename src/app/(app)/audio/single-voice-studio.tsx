'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { apiErrorMessage } from '../../../lib/api-error';
import { getVoices } from '../../api/audio-studio/voices.api';
import type { Voice } from '../../api/audio-studio/audio-stories.types';
import {
	createSingleVoiceProject,
	cancelSingleVoiceGeneration,
	fetchSingleVoiceAudio,
	generateSingleVoice,
	getSingleVoiceProject,
	type SingleVoiceProject
} from '../../api/audio-studio/single-voice.api';

interface Props {
	storyId?: number;
	draftTitle?: string;
	draftScript?: string;
	selectedStyle?: string;
	onStyleChange?: (style: string) => void;
}

const SPEAKING_STYLES = ['Narrative', 'Storytelling', 'Conversational', 'Dramatic', 'Professional', 'Calm'] as const;

export function SingleVoiceStudio({
	storyId,
	draftTitle = '',
	draftScript = '',
	selectedStyle: externalStyle,
	onStyleChange
}: Props) {
	const [savedStoryId, setSavedStoryId] = useState<number | null>(storyId ?? null);

	const [project, setProject] = useState<SingleVoiceProject | null>(null);
	const [voices, setVoices] = useState<Voice[]>([]);
	const [voiceId, setVoiceId] = useState<number | null>(null);

	const [internalStyle, setInternalStyle] = useState('');
	const selectedStyle = externalStyle ?? internalStyle;
	const setSelectedStyle = onStyleChange ?? setInternalStyle;

	const [query, setQuery] = useState('');
	const [gender, setGender] = useState('all');

	const [voiceModalOpen, setVoiceModalOpen] = useState(false);

	const [busy, setBusy] = useState(false);
	const generationInFlight = useRef(false);
	const cancelInFlight = useRef(false);
	const [cancelling, setCancelling] = useState(false);
	const handleCancel = async () => {
		if (!savedStoryId || cancelInFlight.current) return;
		cancelInFlight.current = true;
		setCancelling(true);
		try {
			setProject(await cancelSingleVoiceGeneration(savedStoryId));
		} catch (error) {
			setError(apiErrorMessage(error, 'Unable to cancel generation. Please check its status.'));
		} finally {
			cancelInFlight.current = false;
			setCancelling(false);
		}
	};
	const [error, setError] = useState('');

	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	const [loading, setLoading] = useState(true);

	const chooseVoiceRef = useRef<HTMLButtonElement>(null);
	const modalCloseRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		let active = true;

		setLoading(true);

		const load = async () => {
			try {
				const [p, v] = await Promise.all([
					storyId ? getSingleVoiceProject(storyId) : Promise.resolve(null),
					getVoices()
				]);

				if (active) {
					setProject(p);
					setSavedStoryId(storyId ?? null);
					if (p?.style) setInternalStyle(p.style);
					setVoiceId(p?.voiceId ?? null);
					setVoices(v);
					setLoading(false);
				}
			} catch {
				if (active) {
					setError('Could not load voice selection.');
					setLoading(false);
				}
			}
		};

		void load();

		return () => {
			active = false;
		};
	}, [storyId]);

	useEffect(() => {
		if (!savedStoryId || !project || !['SINGLE_PENDING', 'SINGLE_PROCESSING'].includes(project.status)) {
			return;
		}

		let active = true;

		const timer = setInterval(() => {
			getSingleVoiceProject(savedStoryId)
				.then(p => {
					if (active && !cancelInFlight.current) setProject(p);
				})
				.catch(() => undefined);
		}, 3000);

		return () => {
			active = false;
			clearInterval(timer);
		};
	}, [savedStoryId, project?.status]);

	useEffect(() => {
		if (!savedStoryId || !project?.audio?.id) {
			setAudioUrl(null);
			return;
		}

		let active = true;
		let objectUrl: string | null = null;
		setAudioUrl(null);

		fetchSingleVoiceAudio(savedStoryId, project.audio.id)
			.then(blob => {
				if (!active) return;

				objectUrl = URL.createObjectURL(blob);
				setAudioUrl(objectUrl);
			})
			.catch(() => {
				if (active) {
					setError('Could not load generated audio.');
				}
			});

		return () => {
			active = false;

			if (objectUrl) {
				URL.revokeObjectURL(objectUrl);
			}
		};
	}, [savedStoryId, project?.audio?.id]);

	const filtered = useMemo(
		() =>
			voices.filter(
				v =>
					(gender === 'all' || v.gender?.toLowerCase() === gender) &&
					`${v.name} ${v.description || ''}`.toLowerCase().includes(query.toLowerCase())
			),
		[voices, query, gender]
	);

	const selectedVoice = useMemo(() => voices.find(voice => voice.id === voiceId), [voices, voiceId]);

	useEffect(() => {
		if (!voiceModalOpen) return;

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		modalCloseRef.current?.focus();

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				setVoiceModalOpen(false);
				setPreviewUrl(null);
			}
		}

		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.body.style.overflow = previousOverflow;
			document.removeEventListener('keydown', handleKeyDown);
			chooseVoiceRef.current?.focus();
		};
	}, [voiceModalOpen]);

	function closeVoiceModal() {
		setVoiceModalOpen(false);
		setPreviewUrl(null);
	}

	function selectVoice(id: number) {
		setVoiceId(id);
		closeVoiceModal();
	}

	async function handleGenerate() {
		if (
			!voiceId ||
			busy ||
			generationInFlight.current ||
			['SINGLE_PENDING', 'SINGLE_PROCESSING'].includes(project?.status ?? '') ||
			(!savedStoryId && !draftScript.trim())
		) {
			return;
		}

		generationInFlight.current = true;
		setBusy(true);
		setError('');

		try {
			let id = savedStoryId;

			if (!id) {
				const created = await createSingleVoiceProject(
					draftTitle.trim() || 'Untitled Audio',
					draftScript.trim()
				);

				id = created.id;
				setSavedStoryId(id);
			}

			await generateSingleVoice(id, voiceId, {
				style: selectedStyle || undefined,
				...(!storyId ? { title: draftTitle.trim() || 'Untitled Audio', content: draftScript.trim() } : {})
			});

			setProject(previous => ({
				id: id!,
				title: draftTitle || previous?.title || 'Untitled Audio',
				content: draftScript || previous?.content || '',
				voiceId,
				audio: previous?.audio ?? null,
				status: 'SINGLE_PENDING'
			}));
			setProject(await getSingleVoiceProject(id));
		} catch (error) {
			setError(apiErrorMessage(error, 'Could not start generation. Check your project status before retrying.'));
		} finally {
			generationInFlight.current = false;
			setBusy(false);
		}
	}

	function download() {
		if (!audioUrl || !project) return;

		const link = document.createElement('a');
		link.href = audioUrl;

		link.download = `${project.title.replace(/[^\w\- ]/g, '').trim() || 'audio'}.wav`;

		document.body.appendChild(link);
		link.click();
		link.remove();
	}

	if (loading) {
		return <div className='p-5 text-sm text-slate-400'>Loading Single Voice Studio...</div>;
	}

	if (storyId && !project) {
		return (
			<p role='alert' className='text-red-400'>
				{error || 'Project unavailable.'}
			</p>
		);
	}

	return (
		<div className='flex min-h-0 min-w-0 flex-col gap-2 sm:gap-3 xl:h-full xl:overflow-y-auto'>
			{/* Compact Voice Selection */}
			<section className='shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 sm:p-4'>
				<div className='flex items-center justify-between gap-2'>
					<div className='min-w-0'>
						<h2 className='text-sm font-semibold text-white sm:text-lg'>Select Voice (Single Voice)</h2>

						<p className='mt-1 hidden text-xs text-slate-400 sm:block'>{voices.length} available voices</p>
					</div>

					<button
						ref={chooseVoiceRef}
						type='button'
						onClick={() => setVoiceModalOpen(true)}
						className='hidden shrink-0 rounded-lg border border-indigo-400/50 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/20 sm:inline-flex sm:px-4 sm:text-sm'
					>
						{selectedVoice ? 'Change Voice' : 'Choose Voice'}
					</button>
				</div>

				<div className='mt-2 flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 sm:mt-3 sm:gap-3 sm:p-3'>
					<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 sm:h-9 sm:w-9'>
						🎙️
					</div>
					<div className='min-w-0 flex-1'>
						<p className='truncate text-sm font-semibold text-white'>
							{selectedVoice?.name ?? 'No voice selected'}
						</p>
						<p className='hidden text-xs text-slate-400 sm:mt-1 sm:block'>
							{selectedVoice?.gender ?? 'Choose a voice to narrate your script.'}
						</p>
					</div>
					<button
						type='button'
						onClick={() => setVoiceModalOpen(true)}
						className='shrink-0 rounded-lg border border-indigo-400/50 bg-indigo-500/10 px-2.5 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 sm:hidden'
					>
						{selectedVoice ? 'Change' : 'Choose Voice'}
					</button>
				</div>
			</section>

			{onStyleChange === undefined && (
				<section className='shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 sm:p-4'>
					<div className='flex items-center gap-2 sm:block'>
						<label
							htmlFor='single-voice-style'
							className='shrink-0 text-xs font-medium text-white sm:text-sm'
						>
							Speaking Style
							<span className='ml-2 hidden font-normal text-slate-400 sm:inline'>(Optional)</span>
						</label>

						<select
							id='single-voice-style'
							value={selectedStyle}
							onChange={e => setSelectedStyle(e.target.value)}
							disabled={busy || ['SINGLE_PENDING', 'SINGLE_PROCESSING'].includes(project?.status ?? '')}
							className='min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-sm text-white sm:mt-2 sm:w-full sm:px-3 sm:py-2'
						>
							<option value=''>Default / Natural</option>

							{SPEAKING_STYLES.map(style => (
								<option key={style} value={style}>
									{style}
								</option>
							))}
						</select>
					</div>

					<p className='mt-2 hidden text-xs text-slate-500 sm:block'>
						Applies to the entire narration. Emotion tags can change the delivery of individual dialogue
						segments.
					</p>
				</section>
			)}

			{/* Generate Audio */}
			<section className='shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 sm:p-4'>
				<div className='flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between'>
					<div className='min-w-0'>
						<h2 className='text-sm font-semibold text-white sm:text-lg'>Generate Audio</h2>

						<p className='mt-1 hidden text-xs text-slate-400 sm:block'>
							{(project?.content ?? draftScript).length.toLocaleString()} characters ·{' '}
							{project?.status.replace('SINGLE_', '').toLowerCase() ?? 'ready'}
						</p>
					</div>

					<button
						type='button'
						onClick={handleGenerate}
						disabled={
							!voiceId ||
							busy ||
							(!savedStoryId && !draftScript.trim()) ||
							['SINGLE_PENDING', 'SINGLE_PROCESSING'].includes(project?.status ?? '')
						}
						className='w-full rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-3 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:shrink-0 sm:px-5 sm:py-3'
					>
						{['SINGLE_PENDING', 'SINGLE_PROCESSING'].includes(project?.status ?? '')
							? 'Generating...'
							: busy
								? 'Starting...'
								: project?.audio
									? 'Regenerate Audio'
									: 'Generate Audio'}
					</button>
				</div>

				{['SINGLE_PENDING', 'SINGLE_PROCESSING'].includes(project?.status ?? '') && (
					<div className='mt-3 flex flex-wrap items-center gap-3'>
						<button type='button' onClick={() => void handleCancel()} disabled={cancelling}
							className='rounded-lg border border-rose-400/40 px-4 py-2 text-sm text-rose-300 disabled:opacity-50'>
							{cancelling ? 'Cancelling...' : 'Cancel generation'}
						</button>
						<p role='status' className='text-xs text-slate-400'>Previous audio stays saved. An in-flight provider request may still be charged.</p>
					</div>
				)}
				{project?.status === 'SINGLE_CANCELLED' && <p role='status' className='mt-3 text-sm text-slate-300'>Generation cancelled. Previous audio is still available.</p>}

				{project?.error && (
					<p role='alert' className='mt-3 text-sm text-red-400'>
						{project.error}
					</p>
				)}
				{project?.audio && project.audioIsCurrent === false && (
					<p className='mt-3 text-xs text-amber-300'>
						Previous audio is available. Generate audio for the current script and voice.
					</p>
				)}
				{project?.status === 'SINGLE_FAILED' && (
					<p role='alert' className='mt-3 text-sm text-rose-400'>
						Generation failed. Try again or choose another voice.
					</p>
				)}

				{error && (
					<p role='alert' className='mt-3 text-sm text-rose-400'>
						{error}
					</p>
				)}

				{audioUrl && (
					<div className='mt-4 flex flex-col gap-3 sm:flex-row sm:items-center'>
						<audio controls src={audioUrl} className='min-w-0 w-full flex-1' />

						<button
							type='button'
							onClick={download}
							className='rounded-lg border border-indigo-400/50 px-4 py-2 text-sm text-indigo-300'
						>
							Download WAV
						</button>
					</div>
				)}
			</section>

			{/* Voice Selection Modal */}
			{voiceModalOpen && (
				<div
					className='fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6'
					onMouseDown={event => {
						if (event.target === event.currentTarget) {
							closeVoiceModal();
						}
					}}
				>
					<div
						role='dialog'
						aria-modal='true'
						aria-labelledby='voice-selection-title'
						className='flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#181820] shadow-2xl'
					>
						<div className='flex shrink-0 items-start justify-between gap-3 border-b border-white/10 p-4 sm:p-5'>
							<div>
								<h2 id='voice-selection-title' className='text-lg font-semibold text-white'>
									Choose Voice
								</h2>

								<p className='mt-1 truncate text-xs text-slate-400 sm:hidden'>
									{selectedVoice?.name ?? 'No voice selected'}
								</p>
								<p className='mt-1 hidden text-xs sm:block text-slate-400'>
									{voices.length} available voices
								</p>
							</div>

							<button
								ref={modalCloseRef}
								type='button'
								onClick={closeVoiceModal}
								aria-label='Close voice selection'
								className='rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-white/10 hover:text-white'
							>
								×
							</button>
						</div>

						<div className='flex shrink-0 gap-2 border-b border-white/10 p-3 sm:p-4'>
							<input
								value={query}
								onChange={e => setQuery(e.target.value)}
								placeholder='Search voices...'
								aria-label='Search voices'
								className='min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-400'
							/>

							<select
								value={gender}
								onChange={e => setGender(e.target.value)}
								aria-label='Filter voice gender'
								className='max-w-[120px] rounded-lg border border-white/10 bg-slate-900 px-2 py-2 text-xs text-white sm:max-w-none sm:px-3 sm:text-sm'
							>
								<option value='all'>All Voices</option>
								<option value='male'>Male</option>
								<option value='female'>Female</option>
							</select>
						</div>

						<div className='min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4'>
							<div className='grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3'>
								{filtered.map(voice => (
									<div
										key={voice.id}
										className={`min-w-0 rounded-xl border p-3 ${
											voiceId === voice.id
												? 'border-indigo-400 bg-indigo-500/15'
												: 'border-white/10 bg-white/[0.04]'
										}`}
									>
										<button
											type='button'
											onClick={() => selectVoice(voice.id)}
											aria-pressed={voiceId === voice.id}
											className='flex w-full items-start justify-between gap-2 text-left'
										>
											<span className='min-w-0'>
												<span className='block truncate text-sm font-semibold text-white'>
													{voice.name}
												</span>

												<span className='text-xs text-slate-400'>
													{voice.gender || 'Voice'}
												</span>
											</span>

											<span className='text-indigo-400'>{voiceId === voice.id ? '●' : '○'}</span>
										</button>

										{voice.previewUrl && (
											<button
												type='button'
												onClick={() =>
													setPreviewUrl(
														previewUrl === voice.previewUrl ? null : voice.previewUrl
													)
												}
												className='mt-3 text-xs font-medium text-indigo-300 hover:text-indigo-200'
											>
												{previewUrl === voice.previewUrl ? 'Stop preview' : '▶ Preview'}
											</button>
										)}

										{previewUrl === voice.previewUrl && voice.previewUrl && (
											<audio autoPlay controls src={voice.previewUrl} className='mt-2 w-full' />
										)}
									</div>
								))}

								{filtered.length === 0 && <p className='text-sm text-slate-400'>No matching voices.</p>}
							</div>
						</div>

						<div className='shrink-0 border-t border-white/10 p-3 sm:p-4'>
							<button
								type='button'
								onClick={closeVoiceModal}
								className='w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5'
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
