'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { AudioStory } from '../../api/audio-studio/audio-stories.types';
import { StatusBadge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import { Select } from '@/src/components/ui/select';
interface AudioStoriesListProps {
	stories: AudioStory[];
	loading: boolean;
	error: string;
}

const STATUS_LABELS: Record<string, string> = {
	PENDING: 'Not Analyzed',
	PROCESSING: 'Analyzing',
	COMPLETED: 'Analyzed',
	FAILED: 'Analysis Failed'
};

export function AudioStoriesList({ stories, loading, error }: AudioStoriesListProps) {
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState('ALL');

	const filteredStories = useMemo(() => {
		const query = search.trim().toLowerCase();

		return stories.filter(story => {
			const matchesSearch = story.title.toLowerCase().includes(query);

			const matchesStatus = statusFilter === 'ALL' || story.analysisStatus === statusFilter;

			return matchesSearch && matchesStatus;
		});
	}, [stories, search, statusFilter]);

	if (loading) {
		return <p className='py-8 text-center text-sm text-slate-400'>Loading stories...</p>;
	}

	if (error) {
		return <p className='py-8 text-center text-sm text-red-400'>{error}</p>;
	}

	return (
		<div className='space-y-4'>
			{/* Search and Filter */}
			<div className='flex flex-col gap-3 sm:flex-row'>
				<Input
					type='search'
					variant='dark'
					value={search}
					onChange={e => setSearch(e.target.value)}
					placeholder='Search stories...'
					aria-label='Search stories'
					className='flex-1'
				/>

				<Select
					variant='dark'
					value={statusFilter}
					onChange={e => setStatusFilter(e.target.value)}
					aria-label='Filter stories by status'
					className='sm:w-48'
				>
					<option value='ALL'>All Status</option>
					<option value='PENDING'>Not Analyzed</option>
					<option value='PROCESSING'>Analyzing</option>
					<option value='COMPLETED'>Analyzed</option>
					<option value='FAILED'>Analysis Failed</option>
				</Select>
			</div>

			<p className='text-xs text-slate-500'>
				Showing {filteredStories.length} of {stories.length} stories
			</p>

			{/* Stories Table */}
			<div className='overflow-hidden rounded-xl border border-white/10'>
				<div className='max-h-[420px] overflow-auto'>
					<table className='w-full min-w-[560px] text-left text-sm'>
						<thead className='sticky top-0 z-10 bg-slate-900 text-xs uppercase tracking-wide text-slate-400'>
							<tr>
								<th className='px-5 py-4 font-medium'>Story</th>
								<th className='px-5 py-4 font-medium'>Scenes</th>
								<th className='px-5 py-4 font-medium'>Status</th>
								<th className='px-5 py-4 text-right font-medium'>Action</th>
							</tr>
						</thead>

						<tbody className='divide-y divide-white/5'>
							{filteredStories.map(story => {
								const analyzed =
									story.analysisStatus === 'COMPLETED' &&
									story.analysisResult?.validation.valid === true;

								const statusLabel =
									story.analysisStatus === 'COMPLETED' && !analyzed
										? 'Invalid Analysis'
										: (STATUS_LABELS[story.analysisStatus] ?? story.analysisStatus);

								return (
									<tr key={story.id} className='transition-colors hover:bg-white/[0.04]'>
										<td className='max-w-[320px] px-5 py-4'>
											<Link
												href={`/audio/stories/${story.id}`}
												title={story.title}
												className='block truncate font-medium text-white hover:text-indigo-300'
											>
												{story.title}
											</Link>
										</td>

										<td className='px-5 py-4 text-slate-400'>
											{analyzed ? story.analysisResult?.scenes.length : '—'}
										</td>

										<td className='px-5 py-4'>
											<StatusBadge
												status={
													story.analysisStatus === 'COMPLETED' && !analyzed
														? 'INVALID_ANALYSIS'
														: story.analysisStatus
												}
												variant='dark'
												label={statusLabel}
											/>
										</td>

										<td className='px-5 py-4 text-right'>
											<Link
												href={`/audio/stories/${story.id}`}
												className='text-xs font-medium text-indigo-400 hover:text-indigo-300'
											>
												Open →
											</Link>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>

			{filteredStories.length === 0 && (
				<p className='py-6 text-center text-sm text-slate-400'>
					{stories.length === 0
						? 'No stories yet. Create your first story.'
						: 'No stories match your search or filter.'}
				</p>
			)}
		</div>
	);
}
