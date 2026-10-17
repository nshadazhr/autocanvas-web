export type AnalysisStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface AudioStoryCharacter {
	name: string;
	gender: string;
}

export interface AudioStoryScene {
	text: string;
	style: string;
	emotion: string;
	language: string;
	sceneOrder: number;
	speakerName: string;
}

export interface AudioStoryAnalysisResult {
	storyId: number;
	source: string;
	characters: AudioStoryCharacter[];
	scenes: AudioStoryScene[];
	validation: {
		valid: boolean;
		errors: string[];
		totalScenes: number;
	};
	parserErrors: string[];
}

export interface AudioStory {
	id: number;
	title: string;
	content: string;
	userId: number;
	status: string;
	analysisStatus: AnalysisStatus;
	analysisError: string | null;
	analysisResult: AudioStoryAnalysisResult | null;
	analyzedAt: string | null;
	analysisStartedAt: string | null;
	analysisAttemptId: string | null;
	created_at: string;
	updated_at: string;
}

export interface CreateAudioStoryRequest {
	title: string;
	content: string;
}

export interface UpdateAudioStoryRequest {
	title?: string;
	content?: string;
}

export interface Voice {
	id: number;
	name: string;
	gender: string | null;
	ageCategory: string | null;
	description: string | null;
	style: string | null;
	languages: string[];
	previewUrl: string | null;
}
