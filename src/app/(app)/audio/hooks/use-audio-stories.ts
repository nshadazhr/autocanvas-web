'use client';

import { useEffect, useState } from 'react';
import { getAudioStories } from '../../../api/audio-studio/audio-stories.api';
import type { AudioStory } from '../../../api/audio-studio/audio-stories.types';

export function useAudioStories() {
	const [stories, setStories] = useState<AudioStory[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		async function loadStories() {
			try {
				const data = await getAudioStories();
				setStories(data);
			} catch {
				setError('Failed to load stories.');
			} finally {
				setLoading(false);
			}
		}

		loadStories();
	}, []);

	const totalScenes = stories.reduce((total, story) => {
		if (story.analysisStatus !== 'COMPLETED' || story.analysisResult?.validation.valid !== true) {
			return total;
		}

		return total + story.analysisResult.scenes.length;
	}, 0);

	return {
		stories,
		loading,
		error,
		totalStories: stories.length,
		totalScenes
	};
}
