import api from '../axios';
import type { AudioGenerationJob, AudioGenerationJobDetails, StoryAudioHistory } from './audio-generation.types';

export const createAudioGenerationJob = async (storyId: number): Promise<AudioGenerationJob> => {
	const response = await api.post<AudioGenerationJob>(`/audio-generation/stories/${storyId}/jobs`);
	return response.data;
};

export const getAudioGenerationJob = async (jobId: number): Promise<AudioGenerationJobDetails> => {
	const response = await api.get<AudioGenerationJobDetails>(`/audio-generation/jobs/${jobId}`);
	return response.data;
};

export const retryAudioGenerationJob = async (jobId: number): Promise<AudioGenerationJob> => {
	const response = await api.post<AudioGenerationJob>(`/audio-generation/jobs/${jobId}/retry`);
	return response.data;
};

export const getGeneratedAudioBlob = async (audioId: number): Promise<Blob> => {
	const response = await api.get<Blob>(`/audio-generation/audio/${audioId}/stream`, {
		responseType: 'blob'
	});

	return response.data;
};

export const getStoryAudioHistory = async (storyId: number): Promise<StoryAudioHistory> => {
	const response = await api.get<StoryAudioHistory>(`/audio-generation/stories/${storyId}/audio-history`);

	return response.data;
};

export type CombinedWavExport = {
	id: number;
	storyId: number;
	format: string;
	durationMs: number;
	filename: string;
};

export async function exportCombinedWav(storyId: number): Promise<CombinedWavExport> {
	const { data } = await api.post<CombinedWavExport>(`/audio-generation/stories/${storyId}/export-wav`);

	return data;
}

export async function downloadCombinedWav(assetId: number): Promise<Blob> {
	const { data } = await api.get<Blob>(`/audio-generation/exports/${assetId}/download`, { responseType: 'blob' });

	return data;
}

export const downloadStoryAudioZip = async (storyId: number): Promise<Blob> => {
	const response = await api.get<Blob>(`/audio-generation/stories/${storyId}/download-zip`, {
		responseType: 'blob'
	});

	return response.data;
};

export const regenerateSingleScene = async (storyId: number, sceneId: number): Promise<AudioGenerationJob> => {
	const response = await api.post<AudioGenerationJob>(
		`/audio-generation/stories/${storyId}/scenes/${sceneId}/regenerate`
	);

	return response.data;
};
