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
		<div className='flex h-[calc(100dvh-80px)] min-h-0 min-w-0 flex-col gap-5 pb-4 sm:h-auto sm:gap-6 sm:pb-6'>
			{/* Header */}
			{hero}
			{/* Overview - 3 columns on all screens */}
			<div className='grid min-w-0 grid-cols-3 gap-2 sm:gap-4'>
				<div className='min-w-0'>
					<StatTile
						label='Total Stories'
						value={displayValue(totalStories)}
						hint='Your audio projects'
						variant='dark'
					/>
				</div>

				<div className='min-w-0'>
					<StatTile
						label='Total Scenes'
						value={displayValue(totalScenes)}
						hint='Scenes across all stories'
						variant='dark'
					/>
				</div>

				<div className='min-w-0'>
					<StatTile
						label='Analyzed'
						value={displayValue(analyzedStories)}
						hint='Ready for audio'
						variant='dark'
					/>
				</div>
			</div>
			{/* Stories Workspace */}
			<Card variant='dark' className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden sm:flex-none'>
				<div className='border-b border-white/10 px-4 py-4 sm:px-5'>
					<h2 className='text-base font-semibold text-white sm:text-lg'>My Stories</h2>

					<p className='mt-1 hidden text-sm text-slate-400 sm:block'>
						Manage your stories and audio projects.
					</p>
				</div>

				<div className='min-h-0 min-w-0 flex-1 overflow-hidden p-3 sm:flex-none sm:overflow-visible sm:p-5'>
					<AudioStoriesList stories={stories} loading={loading} error={error} />
				</div>
			</Card>
		</div>
	);
}
