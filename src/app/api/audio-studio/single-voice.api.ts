import api from '../axios';

export interface SingleVoiceProject {
	id: number;
	title: string;
	content: string;
	status: string;
	voiceId: number | null;
	audio: { id: number; durationMs: number | null; createdAt: string } | null;
}

export interface SingleVoiceGenerateOptions {
	style?: string;
}

export async function createSingleVoiceProject(title: string, content: string): Promise<{ id: number }> {
	const response = await api.post('/audio-generation/single/stories', {
		title,
		content
	});
	return response.data;
}

export async function getSingleVoiceProject(id: number): Promise<SingleVoiceProject> {
	const response = await api.get(`/audio-generation/single/stories/${id}`);
	return response.data;
}

export async function generateSingleVoice(
	id: number,
	voiceId: number,
	options: SingleVoiceGenerateOptions = {}
): Promise<void> {
	await api.post(`/audio-generation/single/stories/${id}/generate`, {
		voiceId,
		...(options.style?.trim() ? { style: options.style.trim() } : {})
	});
}

export async function fetchSingleVoiceAudio(id: number, audioId: number): Promise<Blob> {
	const response = await api.get(`/audio-generation/single/stories/${id}/audio/${audioId}`, { responseType: 'blob' });
	return response.data;
}
