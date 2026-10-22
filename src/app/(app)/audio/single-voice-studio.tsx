'use client';

import { useEffect, useMemo, useState } from 'react';
import { getVoices } from '../../api/audio-studio/voices.api';
import type { Voice } from '../../api/audio-studio/audio-stories.types';
import {
	createSingleVoiceProject,
	fetchSingleVoiceAudio,
	generateSingleVoice,
	getSingleVoiceProject,
	type SingleVoiceProject
} from '../../api/audio-studio/single-voice.api';

interface Props {
	storyId?: number;
	draftTitle?: string;
	draftScript?: string;
}

const SPEAKING_STYLES = ['Narrative', 'Storytelling', 'Conversational', 'Dramatic', 'Professional', 'Calm'] as const;

export function SingleVoiceStudio({ storyId, draftTitle = '', draftScript = '' }: Props) {
	const [savedStoryId, setSavedStoryId] = useState<number | null>(storyId ?? null);
	const [project, setProject] = useState<SingleVoiceProject | null>(null);
	const [voices, setVoices] = useState<Voice[]>([]);
	const [voiceId, setVoiceId] = useState<number | null>(null);

	// Optional speaking style
	const [selectedStyle, setSelectedStyle] = useState('');

	const [query, setQuery] = useState('');
	const [gender, setGender] = useState('all');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

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
		if (!savedStoryId || !project || project.status !== 'SINGLE_PROCESSING') {
			return;
		}

		let active = true;

		const timer = setInterval(() => {
			getSingleVoiceProject(savedStoryId)
				.then(p => {
					if (active) setProject(p);
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
			if (objectUrl) URL.revokeObjectURL(objectUrl);
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

	async function handleGenerate() {
		if (!voiceId || busy || project?.status === 'SINGLE_PROCESSING' || (!savedStoryId && !draftScript.trim())) {
			return;
		}

		setBusy(true);
		setError('');

		try {
			// Save only when the user clicks Generate Audio.
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
				style: selectedStyle || undefined
			});

			setProject(await getSingleVoiceProject(id));
		} catch {
			setError('Could not start generation. If your project was saved, check My Stories before retrying.');
		} finally {
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
		<div className='flex min-h-0 flex-col gap-3 xl:h-full xl:overflow-hidden'>
			{/* Voice Selection */}
			<section className='flex min-h-0 flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4 xl:flex-1 xl:overflow-hidden'>
				<div className='flex flex-wrap items-center justify-between gap-2'>
					<h2 className='text-lg font-semibold text-white'>Select Voice (Single Voice)</h2>

					<span className='text-xs text-slate-400'>{voices.length} available voices</span>
				</div>

				<p className='mt-1 text-xs text-slate-400'>
					One voice narrates the entire script. Preview a voice before selecting.
				</p>

				<div className='mt-4 flex flex-wrap gap-2'>
					<input
						value={query}
						onChange={e => setQuery(e.target.value)}
						placeholder='Search voices...'
						aria-label='Search voices'
						className='min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500'
					/>

					<select
						value={gender}
						onChange={e => setGender(e.target.value)}
						aria-label='Filter voice gender'
						className='rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white'
					>
						<option value='all'>All Voices</option>
						<option value='male'>Male</option>
						<option value='female'>Female</option>
					</select>
				</div>

				<div className='mt-3 grid gap-2 overflow-y-auto overscroll-contain sm:grid-cols-2 lg:grid-cols-3 xl:min-h-0 xl:flex-1 xl:grid-cols-4 xl:content-start xl:pr-1'>
					{filtered.map(voice => (
						<div
							key={voice.id}
							className={`min-w-0 rounded-xl border p-2.5 ${
								voiceId === voice.id
									? 'border-indigo-400 bg-indigo-500/15'
									: 'border-white/10 bg-white/[0.04]'
							}`}
						>
							<button
								type='button'
								onClick={() => setVoiceId(voice.id)}
								aria-pressed={voiceId === voice.id}
								className='flex w-full items-start justify-between gap-2 text-left'
							>
								<span className='min-w-0'>
									<span className='block truncate text-sm font-semibold text-white'>
										{voice.name}
									</span>

									<span className='text-xs text-slate-400'>{voice.gender || 'Voice'}</span>
								</span>

								<span className='text-indigo-400'>{voiceId === voice.id ? '●' : '○'}</span>
							</button>

							{voice.previewUrl && (
								<button
									type='button'
									onClick={() =>
										setPreviewUrl(previewUrl === voice.previewUrl ? null : voice.previewUrl)
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
			</section>

			{/* Optional Speaking Style */}
			<section className='shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4'>
				<label htmlFor='single-voice-style' className='mb-2 block text-sm font-medium text-white'>
					Speaking Style
					<span className='ml-2 font-normal text-slate-400'>(Optional)</span>
				</label>

				<select
					id='single-voice-style'
					value={selectedStyle}
					onChange={e => setSelectedStyle(e.target.value)}
					disabled={busy || project?.status === 'SINGLE_PROCESSING'}
					className='w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white'
				>
					<option value=''>Default / Natural</option>

					{SPEAKING_STYLES.map(style => (
						<option key={style} value={style}>
							{style}
						</option>
					))}
				</select>

				<p className='mt-2 text-xs text-slate-500'>
					Applies to the entire narration. Emotion tags can change the delivery of individual dialogue
					segments.
				</p>
			</section>

			{/* Generate Audio */}
			<section className='shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<div>
						<h2 className='text-lg font-semibold text-white'>Generate Audio (Single Voice)</h2>

						<p className='mt-1 text-xs text-slate-400'>
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
							project?.status === 'SINGLE_PROCESSING'
						}
						className='rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40'
					>
						{project?.status === 'SINGLE_PROCESSING'
							? 'Generating...'
							: busy
								? 'Starting...'
								: project?.audio
									? 'Regenerate Audio'
									: 'Generate Audio'}
					</button>
				</div>

				{project?.status === 'SINGLE_PROCESSING' && (
					<p role='status' className='mt-3 text-sm text-indigo-300'>
						Generating your narration. You can reopen this project later.
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
		</div>
	);
}
