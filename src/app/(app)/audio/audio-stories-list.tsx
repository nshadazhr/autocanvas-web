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

			const matchesStatus =
				statusFilter === 'ALL' ||
				(statusFilter === 'SINGLE'
					? story.status.startsWith('SINGLE_')
					: !story.status.startsWith('SINGLE_') && story.analysisStatus === statusFilter);

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
		<div className='flex h-full min-h-0 min-w-0 flex-col gap-4 sm:h-auto'>
			{/* Search and Filter */}
			<div className='flex min-w-0 flex-row items-center gap-2 sm:gap-3'>
				<div className='min-w-0 flex-[2]'>
					<Input
						type='search'
						variant='dark'
						value={search}
						onChange={e => setSearch(e.target.value)}
						placeholder='Search stories...'
						aria-label='Search stories'
						className='w-full min-w-0'
					/>
				</div>

				<div className='min-w-0 flex-[1] sm:flex-none'>
					<Select
						variant='dark'
						value={statusFilter}
						onChange={e => setStatusFilter(e.target.value)}
						aria-label='Filter stories by status'
						className='w-full min-w-0 sm:w-48'
					>
						<option value='ALL'>All Status</option>
						<option value='SINGLE'>One Voice</option>
						<option value='PENDING'>Not Analyzed</option>
						<option value='PROCESSING'>Analyzing</option>
						<option value='COMPLETED'>Analyzed</option>
						<option value='FAILED'>Analysis Failed</option>
					</Select>
				</div>
			</div>
			<p className='text-xs text-slate-500'>
				Showing {filteredStories.length} of {stories.length} stories
			</p>
			{/* Mobile Stories Cards */}
			<div className='min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1 sm:hidden'>
				{filteredStories.map(story => {
					const isSingleVoice = story.status.startsWith('SINGLE_');

					const analyzed =
						story.analysisStatus === 'COMPLETED' && story.analysisResult?.validation.valid === true;

					const statusLabel = isSingleVoice
						? `One Voice · ${story.status.slice(7).toLowerCase()}`
						: story.analysisStatus === 'COMPLETED' && !analyzed
							? 'Invalid Analysis'
							: (STATUS_LABELS[story.analysisStatus] ?? story.analysisStatus);

					const badgeStatus = isSingleVoice
						? story.status.slice(7)
						: story.analysisStatus === 'COMPLETED' && !analyzed
							? 'INVALID_ANALYSIS'
							: story.analysisStatus;

					const sceneCount = isSingleVoice
						? 'One Voice'
						: analyzed
							? story.analysisResult?.scenes.length
							: '—';

					return (
						<div key={story.id} className='min-w-0 rounded-xl border border-white/10 bg-white/[0.03] p-3'>
							<Link
								href={`/audio/stories/${story.id}`}
								title={story.title}
								className='block break-words text-sm font-semibold text-white hover:text-indigo-300'
							>
								{story.title}
							</Link>

							<div className='mt-3 flex min-w-0 flex-wrap items-center justify-between gap-2'>
								<StatusBadge status={badgeStatus} variant='dark' label={statusLabel} />

								<Link
									href={`/audio/stories/${story.id}`}
									className='shrink-0 text-xs font-medium text-indigo-400 hover:text-indigo-300'
								>
									Open →
								</Link>
							</div>

							<div className='mt-3 border-t border-white/5 pt-2 text-xs text-slate-500'>
								{isSingleVoice ? <span>{sceneCount}</span> : <span>Scenes: {sceneCount}</span>}
							</div>
						</div>
					);
				})}
			</div>
			{/* Desktop Stories Table */}
			<div className='hidden min-w-0 overflow-hidden rounded-xl border border-white/10 sm:block'>
				<div className='max-h-[calc(100dvh-380px)] min-h-0 overflow-y-auto overflow-x-auto'>
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

								const statusLabel = story.status.startsWith('SINGLE_')
									? `One Voice · ${story.status.slice(7).toLowerCase()}`
									: story.analysisStatus === 'COMPLETED' && !analyzed
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
											{story.status.startsWith('SINGLE_')
												? 'One Voice'
												: analyzed
													? story.analysisResult?.scenes.length
													: '—'}
										</td>

										<td className='px-5 py-4'>
											<StatusBadge
												status={
													story.status.startsWith('SINGLE_')
														? story.status.slice(7)
														: story.analysisStatus === 'COMPLETED' && !analyzed
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
