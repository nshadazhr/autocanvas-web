import api from '../axios';

export async function cancelSingleVoiceGeneration(id: number): Promise<SingleVoiceProject> {
	const { data } = await api.post<SingleVoiceProject>(`/audio-generation/single/stories/${id}/cancel`);
	return data;
}

export interface SingleVoiceProject {
	id: number;
	title: string;
	content: string;
	status: string;
	voiceId: number | null;
	style?: string | null;
	error?: string | null;
	audioIsCurrent?: boolean;
	audio: { id: number; durationMs: number | null; createdAt: string } | null;
}

export interface SingleVoiceGenerateOptions {
	style?: string;
	title?: string;
	content?: string;
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
		...(options.style?.trim() ? { style: options.style.trim() } : {}),
		...(options.title !== undefined ? { title: options.title } : {}),
		...(options.content !== undefined ? { content: options.content } : {})
	});
}

export async function fetchSingleVoiceAudio(id: number, audioId: number): Promise<Blob> {
	const response = await api.get(`/audio-generation/single/stories/${id}/audio/${audioId}`, { responseType: 'blob' });
	return response.data;
}
