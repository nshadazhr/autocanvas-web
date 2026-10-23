export type AudioGenerationStatus =
	'PENDING' | 'PROCESSING' | 'WAITING' | 'COMPLETED' | 'FAILED' | 'PARTIAL' | 'CANCELLED' | 'SKIPPED';
export interface AudioGenerationJob {
	id: number;
	storyId: number;
	status: AudioGenerationStatus;
	totalScenes: number;
	completedScenes: number;
	failedScenes: number;
}

export interface GeneratedSceneAudio {
	id: number;
	filePath: string;
	durationMs: number | null;
	format: string;
}

export interface AudioGenerationItem {
	id: number;
	sceneId: number;
	status: AudioGenerationStatus;
	attempts: number;
	error: string | null;
	nextRetryAt?: string | null;
	audio: GeneratedSceneAudio | null;
}

export interface AudioGenerationJobDetails extends AudioGenerationJob {
	items: AudioGenerationItem[];
}

export type SceneAudioVersion = {
	id: number;
	sceneId: number;
	voiceId: number;
	format: string;
	durationMs: number | null;
	created_at: string;
	textSnapshot: string;
	voice: {
		id: number;
		name: string;
	};
};

export type SceneAudioHistory = {
	id: number;
	sceneOrder: number;
	title: string | null;
	speakerName: string | null;
	assignedVoice?: { id: number; name: string } | null;
	downloadFilename?: string;
	text: string;
	latestAudio: SceneAudioVersion | null;
	lastGeneration?: Omit<AudioGenerationItem, 'audio'> | null;
	audioVersions: SceneAudioVersion[];
};

export type StoryAudioHistory = {
	storyId: number;
	title: string;
	totalScenes: number;
	generatedScenes: number;
	scenes: SceneAudioHistory[];
};
