'use client';

import { useEffect, useState } from 'react';
import { getGeneratedAudioBlob } from '../../../api/audio-studio/audio-generation.api';

type Props = {
	audioId: number;
	sceneId: number;
};

export function GeneratedAudioPlayer({ audioId, sceneId }: Props) {
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [downloading, setDownloading] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		let cancelled = false;
		let objectUrl: string | null = null;

		setAudioUrl(null);
		setLoading(true);
		setError('');

		getGeneratedAudioBlob(audioId)
			.then(blob => {
				if (cancelled) return;

				objectUrl = URL.createObjectURL(blob);
				setAudioUrl(objectUrl);
			})
			.catch(() => {
				if (!cancelled) {
					setError('Unable to load audio.');
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
			if (objectUrl) URL.revokeObjectURL(objectUrl);
		};
	}, [audioId]);

	const download = async () => {
		if (downloading) return;

		setDownloading(true);
		setError('');

		try {
			let url = audioUrl;
			let temporaryUrl: string | null = null;

			if (!url) {
				const blob = await getGeneratedAudioBlob(audioId);
				temporaryUrl = URL.createObjectURL(blob);
				url = temporaryUrl;
			}

			const link = document.createElement('a');
			link.href = url;
			link.download = `scene-${sceneId}-audio-${audioId}.wav`;
			document.body.appendChild(link);
			link.click();
			link.remove();

			if (temporaryUrl) {
				window.setTimeout(() => {
					URL.revokeObjectURL(temporaryUrl);
				}, 1000);
			}
		} catch {
			setError('Unable to download audio.');
		} finally {
			setDownloading(false);
		}
	};

	return (
		<div className='mt-3 space-y-3'>
			{loading && <p className='text-xs text-slate-400'>Loading audio...</p>}

			{audioUrl && <audio key={audioId} controls preload='metadata' src={audioUrl} className='w-full' />}

			<button
				type='button'
				onClick={() => void download()}
				disabled={downloading}
				className='rounded-lg border border-indigo-500/40 px-3 py-2 text-sm text-indigo-300 hover:bg-indigo-500/10 disabled:opacity-50'
			>
				{downloading ? 'Downloading...' : 'Download WAV'}
			</button>

			{error && (
				<p role='alert' className='text-xs text-red-400'>
					{error}
				</p>
			)}
		</div>
	);
}
