'use client';

import { useCallback, useEffect, useState } from 'react';
import { getStoryAudioHistory } from '../../../api/audio-studio/audio-generation.api';
import type { StoryAudioHistory } from '../../../api/audio-studio/audio-generation.types';
import { GeneratedAudioPlayer } from './generated-audio-player';

type Props = {
	storyId: number;
	refreshKey?: number;
};

export function StoryAudioHistoryPanel({ storyId, refreshKey }: Props) {
	const [history, setHistory] = useState<StoryAudioHistory | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	const loadHistory = useCallback(async () => {
		setLoading(true);
		setError('');

		try {
			const data = await getStoryAudioHistory(storyId);
			setHistory(data);
		} catch {
			setError('Unable to load audio history.');
		} finally {
			setLoading(false);
		}
	}, [storyId]);

	useEffect(() => {
		void loadHistory();
	}, [loadHistory, refreshKey]);

	return (
		<section className='space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6'>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<div>
					<h2 className='text-lg font-semibold text-white'>Generated Audio Library</h2>
					<p className='mt-1 text-sm text-slate-400'>
						{history
							? `${history.generatedScenes}/${history.totalScenes} scenes have generated audio`
							: 'View generated audio and previous versions'}
					</p>
				</div>

				<button
					type='button'
					onClick={() => void loadHistory()}
					disabled={loading}
					className='rounded-lg border border-white/20 px-4 py-2 text-sm text-white disabled:opacity-50'
				>
					Refresh History
				</button>
			</div>

			{loading && <p className='text-sm text-slate-400'>Loading audio history...</p>}

			{error && (
				<p role='alert' className='text-sm text-red-400'>
					{error}
				</p>
			)}

			{!loading && history && (
				<div className='space-y-4'>
					{history.scenes.map(scene => (
						<div key={scene.id} className='rounded-xl border border-white/10 p-4'>
							<div className='mb-3'>
								<h3 className='font-medium text-white'>
									Scene {scene.sceneOrder}
									{scene.speakerName ? ` — ${scene.speakerName}` : ''}
								</h3>
								<p className='mt-1 text-sm text-slate-400'>{scene.text}</p>
							</div>

							{scene.latestAudio ? (
								<>
									<p className='text-xs text-emerald-400'>
										Latest Audio · {scene.latestAudio.voice.name}
									</p>

									<GeneratedAudioPlayer audioId={scene.latestAudio.id} sceneId={scene.id} />

									{scene.audioVersions.length > 1 && (
										<details className='mt-4'>
											<summary className='cursor-pointer text-sm text-indigo-300'>
												Previous Versions ({scene.audioVersions.length - 1})
											</summary>

											<div className='mt-3 space-y-3'>
												{scene.audioVersions.slice(1).map(audio => (
													<div
														key={audio.id}
														className='rounded-lg border border-white/10 p-3'
													>
														<p className='text-xs text-slate-400'>
															Audio #{audio.id} · {audio.voice.name}
															{' · '}
															{new Date(audio.created_at).toLocaleString()}
														</p>

														<GeneratedAudioPlayer audioId={audio.id} sceneId={scene.id} />
													</div>
												))}
											</div>
										</details>
									)}
								</>
							) : (
								<p className='text-sm text-slate-500'>No audio generated yet.</p>
							)}
						</div>
					))}
				</div>
			)}
		</section>
	);
}
