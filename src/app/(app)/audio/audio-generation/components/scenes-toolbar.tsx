'use client';

export type SceneStatusFilter = 'ALL' | 'COMPLETED' | 'FAILED' | 'PENDING' | 'PROCESSING' | 'WAITING';

export type SceneViewMode = 'INFINITE' | 'PAGINATION';

type Props = {
	search: string;
	onSearchChange: (value: string) => void;
	status: SceneStatusFilter;
	onStatusChange: (value: SceneStatusFilter) => void;
	voices: string[];
	voice: string;
	onVoiceChange: (value: string) => void;
	viewMode: SceneViewMode;
	onViewModeChange: (value: SceneViewMode) => void;
};

export function ScenesToolbar({
	search,
	onSearchChange,
	status,
	onStatusChange,
	voices,
	voice,
	onVoiceChange,
	viewMode,
	onViewModeChange
}: Props) {
	return (
		<div className='flex flex-wrap items-center gap-3'>
			<input
				type='search'
				value={search}
				onChange={e => onSearchChange(e.target.value)}
				placeholder='Search scene ID...'
				aria-label='Search scenes'
				className='min-w-[180px] flex-1 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500'
			/>

			<select
				value={status}
				onChange={e => onStatusChange(e.target.value as SceneStatusFilter)}
				aria-label='Filter scenes by status'
				className='rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white'
			>
				<option value='ALL'>All Status</option>
				<option value='COMPLETED'>Completed</option>
				<option value='FAILED'>Failed</option>
				<option value='PENDING'>Pending</option>
				<option value='PROCESSING'>Processing</option>
				<option value='WAITING'>Waiting</option>
			</select>

			<select
				value={voice}
				onChange={event => onVoiceChange(event.target.value)}
				aria-label='Filter by voice'
				className='rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500'
			>
				<option value='ALL'>All Voices</option>

				{voices.map(voiceName => (
					<option key={voiceName} value={voiceName}>
						{voiceName}
					</option>
				))}
			</select>
			<select
				value={viewMode}
				onChange={e => onViewModeChange(e.target.value as SceneViewMode)}
				aria-label='Scene navigation mode'
				className='rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white'
			>
				<option value='INFINITE'>Infinite Scroll</option>
				<option value='PAGINATION'>Auto Pagination</option>
			</select>
		</div>
	);
}
