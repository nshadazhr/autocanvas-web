'use client';

import type { ReactNode } from 'react';

import { useAudioStories } from './hooks/use-audio-stories';
import { AudioStoriesList } from './audio-stories-list';
import { Card, StatTile } from '@/src/components/ui/card';

interface AudioStudioDashboardProps {
	hero: ReactNode;
}

export function AudioStudioDashboard({ hero }: AudioStudioDashboardProps) {
	const { stories, loading, error, totalStories, totalScenes } = useAudioStories();

	const analyzedStories = stories.filter(
		story => story.analysisStatus === 'COMPLETED' && story.analysisResult?.validation.valid === true
	).length;

	const displayValue = (value: number) => (loading || error ? '—' : value);

	return (
		<div className='flex min-w-0 flex-col gap-6'>
			{/* Header */}
			{hero}

			{/* Overview */}
			<div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
				<StatTile
					label='Total Stories'
					value={displayValue(totalStories)}
					hint='Your audio projects'
					variant='dark'
				/>

				<StatTile
					label='Total Scenes'
					value={displayValue(totalScenes)}
					hint='Scenes across all stories'
					variant='dark'
				/>

				<StatTile
					label='Analyzed Stories'
					value={displayValue(analyzedStories)}
					hint='Ready for voice assignment'
					variant='dark'
				/>
			</div>

			{/* Stories Workspace */}
			<Card variant='dark' className='min-w-0 overflow-hidden'>
				<div className='border-b border-white/10 px-5 py-4'>
					<h2 className='text-lg font-semibold text-white'>My Stories</h2>

					<p className='mt-1 text-sm text-slate-400'>Manage your stories and audio projects.</p>
				</div>

				<div className='p-5'>
					<AudioStoriesList stories={stories} loading={loading} error={error} />
				</div>
			</Card>
		</div>
	);
}
