import api from '../axios';
import type { AudioStory, CreateAudioStoryRequest, UpdateAudioStoryRequest } from './audio-stories.types';

export const getAudioStories = async (): Promise<AudioStory[]> => {
	const response = await api.get<AudioStory[]>('/audio-stories');
	return response.data;
};

export const createAudioStory = async (data: CreateAudioStoryRequest): Promise<AudioStory> => {
	const response = await api.post<AudioStory>('/audio-stories', data);
	return response.data;
};

export const getAudioStoryById = async (storyId: number): Promise<AudioStory> => {
	const response = await api.get<AudioStory>(`/audio-stories/${storyId}`);
	return response.data;
};

export const updateAudioStory = async (storyId: number, data: UpdateAudioStoryRequest): Promise<AudioStory> => {
	const response = await api.patch<AudioStory>(`/audio-stories/${storyId}`, data);

	return response.data;
};

export const analyzeAudioStory = async (storyId: number): Promise<AudioStory> => {
	const response = await api.post<AudioStory>(`/audio-stories/${storyId}/analyze`);
	console.log('REANALYZE RESPONSE:', response);

	return response.data;
};

export interface StoryCastCharacter {
	id: number;
	name: string;
	gender: string | null;
	voiceId: number | null;
}

export interface UpdateStoryCastRequest {
	characters: {
		name: string;
		gender: string;
		voiceId?: number | null;
	}[];
}

export const getStoryCast = async (storyId: number): Promise<StoryCastCharacter[]> => {
	const response = await api.get<StoryCastCharacter[]>(`/audio-stories/${storyId}/cast`);

	return response.data;
};

export const updateStoryCast = async (storyId: number, data: UpdateStoryCastRequest): Promise<StoryCastCharacter[]> => {
	const response = await api.patch<StoryCastCharacter[]>(`/audio-stories/${storyId}/cast`, data);

	return response.data;
};
