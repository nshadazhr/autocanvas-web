'use client';

import type { AnimationScene } from '@/src/app/api/animation/animation.types';

type TimelinePanelProps = {
	scenes: AnimationScene[];
	activeSceneId: number | null;
	onSceneSelect: (sceneId: number) => void;
	onAddScene: () => void;
};

export default function TimelinePanel({ scenes, activeSceneId, onSceneSelect, onAddScene }: TimelinePanelProps) {
	return (
		<div className='flex h-full min-h-0 flex-col bg-slate-900'>
			{/* Timeline Header */}
			<div className='flex h-12 shrink-0 items-center justify-between border-b border-slate-700 px-4'>
				<div>
					<h2 className='text-sm font-semibold text-white'>Timeline</h2>
				</div>

				<button
					type='button'
					onClick={onAddScene}
					className='rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500'
				>
					+ Add Scene
				</button>
			</div>

			{/* Scene List */}
			<div className='flex min-h-0 flex-1 gap-3 overflow-x-auto p-4'>
				{scenes.length === 0 ? (
					<div className='flex w-full items-center justify-center'>
						<p className='text-sm text-slate-400'>No scenes yet. Add your first scene.</p>
					</div>
				) : (
					scenes.map(scene => (
						<button
							key={scene.id}
							type='button'
							onClick={() => onSceneSelect(scene.id)}
							className={`flex h-24 w-40 shrink-0 flex-col justify-between rounded-lg border p-3 text-left transition-colors ${
								activeSceneId === scene.id
									? 'border-indigo-500 bg-indigo-500/20'
									: 'border-slate-700 bg-slate-800 hover:border-slate-500'
							}`}
						>
							<span className='truncate text-sm font-medium text-white'>{scene.name}</span>

							<span className='text-xs text-slate-400'>{(scene.durationMs / 1000).toFixed(1)} sec</span>
						</button>
					))
				)}
			</div>
		</div>
	);
}
