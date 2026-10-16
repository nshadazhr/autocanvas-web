'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createAudioStory, analyzeAudioStory } from '../../../api/audio-studio/audio-stories.api';

type VoiceMode = 'single' | 'multiple';

export default function CreateAudioPage() {
	const [title, setTitle] = useState('');
	const [script, setScript] = useState('');
	const [voiceMode, setVoiceMode] = useState<VoiceMode>('single');

	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const canContinue = script.trim().length > 0;

	async function handleContinue() {
		if (!script.trim() || loading) return;

		if (voiceMode === 'single') {
			setError('Single Voice generation will be added next.');
			return;
		}

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
		<div className='mx-auto max-w-6xl space-y-6'>
			<Link href='/audio' className='inline-flex text-sm text-slate-400 hover:text-white'>
				← Back to Audio Studio
			</Link>

			<div>
				<h1 className='text-3xl font-bold text-white'>Create Audio</h1>
				<p className='mt-2 text-sm text-slate-400'>
					Write or paste your script and choose how you want it narrated.
				</p>
			</div>

			<div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]'>
				{/* Script Editor */}
				<section className='min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-6'>
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
						className='mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-400'
					/>

					<div className='mt-6 flex items-center justify-between gap-3'>
						<label htmlFor='audio-script' className='text-sm font-semibold text-white'>
							Script Editor
						</label>

						<span className='text-xs text-slate-500'>{script.length.toLocaleString()} characters</span>
					</div>

					<textarea
						id='audio-script'
						value={script}
						onChange={event => setScript(event.target.value)}
						placeholder='Write or paste your story here...'
						className='mt-3 min-h-[420px] w-full resize-y rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-white outline-none placeholder:text-slate-500 focus:border-indigo-400'
					/>

					<p className='mt-2 text-xs text-slate-500'>Supports Hindi, English and other languages.</p>
				</section>

				{/* Voice Mode */}
				<aside className='h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-6'>
					<h2 className='text-base font-semibold text-white'>Voice Mode</h2>

					<p className='mt-1 text-xs text-slate-400'>Choose how your script should be narrated.</p>

					<div className='mt-5 space-y-3'>
						<button
							type='button'
							onClick={() => setVoiceMode('single')}
							aria-pressed={voiceMode === 'single'}
							className={`w-full rounded-xl border p-4 text-left transition-colors ${
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
							className={`w-full rounded-xl border p-4 text-left transition-colors ${
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

					<div className='mt-6 rounded-xl bg-white/5 p-4'>
						<p className='text-xs text-slate-400'>
							{voiceMode === 'single'
								? 'Next: Select a voice and generate audio.'
								: 'Next: Analyze your story and review detected characters.'}
						</p>
					</div>

					{error && (
						<p role='alert' className='mt-4 text-sm text-red-400'>
							{error}
						</p>
					)}

					<button
						type='button'
						onClick={handleContinue}
						disabled={!canContinue || loading}
						className='mt-5 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40'
					>
						{loading
							? 'Analyzing...'
							: voiceMode === 'single'
								? 'Continue to Voice Selection →'
								: 'Analyze Script →'}
					</button>
				</aside>
			</div>
		</div>
	);
}
