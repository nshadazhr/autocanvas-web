'use client';

import { useEffect, useRef, useState } from 'react';
import { getGeneratedAudioBlob } from '../../../../api/audio-studio/audio-generation.api';

function formatTime(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
	const whole = Math.floor(seconds);
	return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/** Compact custom controls; mounting a new scene automatically stops the previous one. */
export function InlineSceneAudioPlayer({ audioId }: { audioId: number }) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [url, setUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [playing, setPlaying] = useState(false);
	const [muted, setMuted] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);

	useEffect(() => {
		let cancelled = false;
		let objectUrl: string | null = null;
		setUrl(null);
		setError(null);
		setPlaying(false);
		setCurrentTime(0);
		setDuration(0);

		void getGeneratedAudioBlob(audioId)
			.then(blob => {
				if (cancelled) return;
				objectUrl = URL.createObjectURL(blob);
				setUrl(objectUrl);
			})
			.catch(() => {
				if (!cancelled) setError('Audio load failed');
			});

		return () => {
			cancelled = true;
			audioRef.current?.pause();
			if (objectUrl) URL.revokeObjectURL(objectUrl);
		};
	}, [audioId]);

	useEffect(() => {
		if (!url) return;
		const audio = audioRef.current;
		if (!audio) return;
		void audio.play().catch(() => {
			// User can press the custom Play button if browser blocks playback.
			setPlaying(false);
		});
	}, [url]);

	const togglePlayback = () => {
		const audio = audioRef.current;
		if (!audio) return;
		if (audio.paused) {
			void audio.play().catch(() => setError('Unable to play audio'));
		} else {
			audio.pause();
		}
	};

	const seek = (next: number) => {
		const audio = audioRef.current;
		if (!audio || !Number.isFinite(audio.duration)) return;
		audio.currentTime = next;
		setCurrentTime(next);
	};

	if (error)
		return (
			<span role='alert' className='block w-full max-w-[320px] text-xs text-red-400'>
				{error}
			</span>
		);

	return (
		<div className='flex h-10 w-full min-w-0 max-w-[320px] items-center gap-2 rounded-lg border border-white/10 bg-slate-800/80 px-2 text-slate-100'>
			<audio
				ref={audioRef}
				src={url ?? undefined}
				preload='metadata'
				onLoadedMetadata={event =>
					setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)
				}
				onDurationChange={event =>
					setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)
				}
				onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)}
				onPlay={() => setPlaying(true)}
				onPause={() => setPlaying(false)}
				onEnded={() => setPlaying(false)}
				onError={() => {
					if (url) setError('Audio playback failed');
				}}
			/>
			<button
				type='button'
				onClick={togglePlayback}
				disabled={!url}
				className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white hover:bg-white/10 disabled:opacity-40'
				aria-label={playing ? 'Pause audio' : 'Play audio'}
				title={playing ? 'Pause' : 'Play'}
			>
				{playing ? '❚❚' : '▶'}
			</button>
			<span className='shrink-0 text-xs tabular-nums text-slate-300'>{formatTime(currentTime)}</span>
			<input
				type='range'
				min={0}
				max={duration > 0 ? duration : 1}
				step={0.05}
				value={Math.min(currentTime, duration > 0 ? duration : 1)}
				onChange={event => seek(Number(event.target.value))}
				disabled={!url || duration <= 0}
				aria-label='Seek audio'
				className='h-1.5 min-w-0 flex-1 cursor-pointer accent-indigo-400 disabled:opacity-40'
			/>
			<span className='shrink-0 text-xs tabular-nums text-slate-300'>{formatTime(duration)}</span>
			<button
				type='button'
				onClick={() => {
					const audio = audioRef.current;
					if (!audio) return;
					audio.muted = !audio.muted;
					setMuted(audio.muted);
				}}
				className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs hover:bg-white/10'
				aria-label={muted ? 'Unmute audio' : 'Mute audio'}
				title={muted ? 'Unmute' : 'Mute'}
			>
				{muted ? '×' : '♪'}
			</button>
		</div>
	);
}
