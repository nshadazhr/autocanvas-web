'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createAudioStory, analyzeAudioStory } from '../../../api/audio-studio/audio-stories.api';
import { SingleVoiceStudio } from '../single-voice-studio';

type VoiceMode = 'single' | 'multiple';

const SPEAKING_STYLES = ['Narrative', 'Storytelling', 'Conversational', 'Dramatic', 'Professional', 'Calm'] as const;

const EMOTION_TAGS = [
	'Happy',
	'Sad',
	'Angry',
	'Excited',
	'Whispers',
	'Shouting',
	'Crying',
	'Laughing',
	'Nervous',
	'Scared',
	'Surprised',
	'Calm',
	'Sarcastic',
	'Serious'
] as const;

export default function CreateAudioPage() {
	const [title, setTitle] = useState('');
	const [script, setScript] = useState('');
	const [voiceMode, setVoiceMode] = useState<VoiceMode>('single');

	const [emotionModalOpen, setEmotionModalOpen] = useState(false);
	const [selectedStyle, setSelectedStyle] = useState('');

	const router = useRouter();

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const scriptRef = useRef<HTMLTextAreaElement>(null);
	const selectionRef = useRef({ start: 0, end: 0 });

	const canContinue = script.trim().length > 0;

	function rememberSelection() {
		const textarea = scriptRef.current;
		if (!textarea) return;

		selectionRef.current = {
			start: textarea.selectionStart,
			end: textarea.selectionEnd
		};
	}

	function insertEmotionTag(emotion: string) {
		const textarea = scriptRef.current;

		const { start, end } = emotionModalOpen
			? selectionRef.current
			: {
					start: textarea?.selectionStart ?? script.length,
					end: textarea?.selectionEnd ?? script.length
				};

		const tag = `[${emotion.toLowerCase()}] `;
		const updatedScript = script.slice(0, start) + tag + script.slice(end);

		setScript(updatedScript);
		setEmotionModalOpen(false);

		const nextPosition = start + tag.length;

		selectionRef.current = {
			start: nextPosition,
			end: nextPosition
		};

		requestAnimationFrame(() => {
			textarea?.focus();
			textarea?.setSelectionRange(nextPosition, nextPosition);
		});
	}

	useEffect(() => {
		if (!emotionModalOpen) return;

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		function handleEscape(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				setEmotionModalOpen(false);
			}
		}

		document.addEventListener('keydown', handleEscape);

		return () => {
			document.body.style.overflow = previousOverflow;
			document.removeEventListener('keydown', handleEscape);
		};
	}, [emotionModalOpen]);

	async function handleContinue() {
		if (!script.trim() || loading) return;

		setLoading(true);
		setError('');

		try {
			const story = await createAudioStory({
				title: title.trim() || 'Untitled Audio',
				content: script.trim()
			});

			await analyzeAudioStory(story.id);

			router.push(`/audio/stories/${story.id}`);
		} catch (err) {
			console.error('Failed to create or analyze story:', err);

			setError(
				'Could not complete the request. Your project may already have been saved. Please check My Stories before trying again.'
			);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className='mx-auto w-full min-w-0 max-w-[1800px] space-y-2 pb-4 sm:space-y-4 xl:flex xl:h-[calc(100dvh-112px)] xl:min-h-0 xl:flex-col xl:overflow-y-auto xl:pb-4'>
			<Link href='/audio' className='inline-flex text-xs text-slate-400 hover:text-white sm:text-sm'>
				← Back to Audio Studio
			</Link>

			<div className='min-w-0'>
				<h1 className='text-xl font-bold text-white sm:text-3xl'>Create Audio</h1>

				<p className='mt-2 hidden text-sm text-slate-400 sm:block'>
					Write or paste your script and choose how you want it narrated.
				</p>
			</div>

			{/* Mobile Voice Mode: always visible side by side */}
			<div className='grid grid-cols-2 gap-2 lg:hidden' role='group' aria-label='Voice Mode'>
				{(
					[
						['single', '🎙️ One Voice'],
						['multiple', '🎭 Character Voices']
					] as const
				).map(([mode, label]) => (
					<button
						key={mode}
						type='button'
						onClick={() => setVoiceMode(mode)}
						aria-pressed={voiceMode === mode}
						className={`min-w-0 rounded-xl border px-2 py-2.5 text-center text-xs font-semibold transition-colors sm:text-sm ${voiceMode === mode ? 'border-indigo-400 bg-indigo-500/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300'}`}
					>
						{label}
					</button>
				))}
			</div>

			<div
				className={`grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(270px,320px)] ${
					voiceMode === 'single'
						? 'xl:shrink-0'
						: 'min-h-[calc(100dvh-320px)] grid-rows-[minmax(0,1fr)] xl:min-h-0 xl:flex-1'
				}`}
			>
				{/* Script Editor */}
				<section
					className={`flex min-h-0 min-w-0 flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4 xl:p-5 ${
						voiceMode === 'multiple' ? 'h-full' : ''
					}`}
				>
					<label htmlFor='audio-title' className='text-sm font-semibold text-white'>
						Project Name
						<span className='ml-2 font-normal text-slate-500'>(Optional)</span>
					</label>
					<input
						id='audio-title'
						type='text'
						value={title}
						onChange={event => setTitle(event.target.value)}
						placeholder='e.g. Gaon Mein Pizza Wala'
						className='mt-1.5 w-full min-w-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-400 sm:px-4 sm:py-3'
					/>
					<div className='mt-2 flex items-center justify-between gap-2 sm:mt-3'>
						<label htmlFor='audio-script' className='text-sm font-semibold text-white'>
							Script Editor
						</label>

						<span className='shrink-0 text-xs text-slate-500'>
							{script.length.toLocaleString()} characters
						</span>
					</div>
					<textarea
						ref={scriptRef}
						id='audio-script'
						value={script}
						onChange={event => setScript(event.target.value)}
						onSelect={rememberSelection}
						onClick={rememberSelection}
						onKeyUp={rememberSelection}
						placeholder='Write or paste your story here...'
						className={`mt-2 block w-full min-w-0 shrink-0 resize-none overflow-y-auto rounded-xl border border-white/10 bg-[#1b1b23] p-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-500 ${
							voiceMode === 'single'
								? 'h-[150px] min-h-[150px] sm:h-[240px] sm:min-h-[240px] xl:h-[300px] xl:min-h-[300px]'
								: 'h-full min-h-[180px] flex-1'
						}`}
						spellCheck={false}
					/>
					{voiceMode === 'single' && (
						<div className='mt-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-end gap-2 sm:gap-3'>
							<div className='min-w-0'>
								<label className='mb-1 block text-xs font-medium text-slate-300'>Quick Emotions</label>
								<button
									type='button'
									onClick={() => {
										rememberSelection();
										setEmotionModalOpen(true);
									}}
									className='w-full rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-2 py-2 text-left text-xs font-medium text-indigo-300 sm:px-3 sm:text-sm'
								>
									+ Emotions
								</button>
							</div>
							<div className='min-w-0'>
								<label
									htmlFor='single-voice-style'
									className='mb-1 block text-xs font-medium text-slate-300'
								>
									Speaking Style
								</label>
								<select
									id='single-voice-style'
									value={selectedStyle}
									onChange={event => setSelectedStyle(event.target.value)}
									className='w-full min-w-0 rounded-lg border border-white/10 bg-slate-900 px-2 py-2 text-xs text-white sm:px-3 sm:text-sm'
								>
									<option value=''>Default / Natural</option>
									{SPEAKING_STYLES.map(style => (
										<option key={style} value={style}>
											{style}
										</option>
									))}
								</select>
							</div>
						</div>
					)}
					<p className='mt-2 hidden text-xs text-slate-500 sm:block'>
						Supports Hindi, English and other languages.
					</p>
				</section>

				{/* Desktop Voice Mode */}
				<aside className='hidden min-h-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:block xl:overflow-y-auto xl:p-5'>
					<h2 className='text-base font-semibold text-white'>Voice Mode</h2>

					<p className='mt-1 text-xs text-slate-400'>Choose how your script should be narrated.</p>

					<div className='mt-3 space-y-2'>
						<button
							type='button'
							onClick={() => setVoiceMode('single')}
							aria-pressed={voiceMode === 'single'}
							className={`w-full rounded-xl border p-3 text-left transition-colors ${
								voiceMode === 'single'
									? 'border-indigo-400 bg-indigo-500/10'
									: 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
							}`}
						>
							<div className='flex items-center justify-between'>
								<span className='text-sm font-semibold text-white'>🎙️ One Voice</span>

								<span className='text-indigo-400'>{voiceMode === 'single' ? '●' : '○'}</span>
							</div>

							<p className='mt-2 text-xs text-slate-400'>Narrate the entire script using one voice.</p>
						</button>

						<button
							type='button'
							onClick={() => setVoiceMode('multiple')}
							aria-pressed={voiceMode === 'multiple'}
							className={`w-full rounded-xl border p-3 text-left transition-colors ${
								voiceMode === 'multiple'
									? 'border-indigo-400 bg-indigo-500/10'
									: 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
							}`}
						>
							<div className='flex items-center justify-between'>
								<span className='text-sm font-semibold text-white'>🎭 Character Voices</span>

								<span className='text-indigo-400'>{voiceMode === 'multiple' ? '●' : '○'}</span>
							</div>

							<p className='mt-2 text-xs text-slate-400'>
								Detect characters and assign different voices.
							</p>
						</button>
					</div>

					<div className='mt-3 rounded-xl bg-white/5 p-3'>
						<p className='text-xs text-slate-400'>
							{voiceMode === 'single'
								? 'Select a voice below, then generate audio.'
								: 'Next: Analyze your story and review detected characters.'}
						</p>
					</div>

					{error && (
						<p role='alert' className='mt-4 text-sm text-red-400'>
							{error}
						</p>
					)}

					{voiceMode === 'multiple' && (
						<button
							type='button'
							onClick={handleContinue}
							disabled={!canContinue || loading}
							className='mt-5 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40'
						>
							{loading ? 'Analyzing...' : 'Analyze Script →'}
						</button>
					)}
				</aside>
			</div>

			{/* Mobile Character Voices Action */}
			{voiceMode === 'multiple' && (
				<div className='lg:hidden'>
					{error && (
						<p role='alert' className='mb-3 text-sm text-red-400'>
							{error}
						</p>
					)}

					<button
						type='button'
						onClick={handleContinue}
						disabled={!canContinue || loading}
						className='w-full rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40'
					>
						{loading ? 'Analyzing...' : 'Analyze Script →'}
					</button>
				</div>
			)}

			{/* Single Voice Studio */}
			{
				<div className={`min-h-0 min-w-0 xl:flex-1 ${voiceMode === 'single' ? '' : 'hidden'}`}>
					<SingleVoiceStudio
						draftTitle={title}
						draftScript={script}
						selectedStyle={selectedStyle}
						onStyleChange={setSelectedStyle}
					/>
				</div>
			}

			{/* Mobile Emotion Modal */}
			{emotionModalOpen && (
				<div
					className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm'
					onMouseDown={event => {
						if (event.target === event.currentTarget) {
							setEmotionModalOpen(false);
						}
					}}
				>
					<div
						role='dialog'
						aria-modal='true'
						aria-labelledby='emotion-modal-title'
						className='max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#181820] p-4 shadow-2xl'
					>
						<div className='flex items-center justify-between gap-3'>
							<h2 id='emotion-modal-title' className='text-lg font-semibold text-white'>
								Quick Emotion Tags
							</h2>

							<button
								type='button'
								onClick={() => setEmotionModalOpen(false)}
								aria-label='Close emotion modal'
								className='rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-white/10 hover:text-white'
							>
								×
							</button>
						</div>

						<p className='mt-2 text-xs text-slate-400'>
							Choose an emotion to insert its tag into your script.
						</p>

						<div className='mt-4 grid grid-cols-2 gap-2'>
							{EMOTION_TAGS.map(emotion => (
								<button
									key={emotion}
									type='button'
									onClick={() => insertEmotionTag(emotion)}
									className='rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left text-sm text-slate-200 transition-colors hover:border-indigo-400/50 hover:bg-indigo-500/10'
								>
									+ {emotion}
								</button>
							))}
						</div>

						<button
							type='button'
							onClick={() => setEmotionModalOpen(false)}
							className='mt-4 w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5'
						>
							Cancel
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
