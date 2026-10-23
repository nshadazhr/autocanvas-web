export type AnalysisStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface StoryAnalysisJob {
	id: string;
	storyId: number;
	status: 'QUEUED' | 'PROCESSING' | 'WAITING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
	attempts: number;
	nextRetryAt: string | null;
	errorCode: string | null;
	errorMessage: string | null;
	source: string | null;
}

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
	analysisJob?: StoryAnalysisJob | null;
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
	displayName: string | null;
	provider: string;
	providerVoiceId: string;
	model: string;
	gender: string | null;
	description: string | null;
	previewUrl: string | null;
}
