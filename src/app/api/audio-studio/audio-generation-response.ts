import type { AudioGenerationJobDetails } from './audio-generation.types';

const statuses = new Set(['PENDING', 'PROCESSING', 'WAITING', 'COMPLETED', 'FAILED', 'PARTIAL', 'CANCELLED', 'SKIPPED']);

export function parseGenerationJobResponse(value: unknown): AudioGenerationJobDetails | null {
	// Nest can send an empty response body when there is no latest job.
	if (value === null || value === undefined || value === '') return null;
	if (typeof value !== 'object') throw new Error('Invalid generation status response. Please refresh.');
	const job = value as AudioGenerationJobDetails;
	if (
		!Number.isSafeInteger(job.id) || job.id <= 0 ||
		!Number.isSafeInteger(job.storyId) || job.storyId <= 0 ||
		!statuses.has(job.status) ||
		![job.totalScenes, job.completedScenes, job.failedScenes].every(count => Number.isSafeInteger(count) && count >= 0) ||
		!Array.isArray(job.items) ||
		!job.items.every(item => item && Number.isSafeInteger(item.sceneId) && statuses.has(item.status))
	) throw new Error('Incomplete generation status response. Please refresh.');
	return job;
}
