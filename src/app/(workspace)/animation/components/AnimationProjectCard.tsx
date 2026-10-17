'use client';

import { AnimationProject } from '@/src/app/api/animation/animation.types';

type AnimationProjectCardProps = {
	project: AnimationProject;
	onOpen: (projectId: number) => void;
	onRename: (project: AnimationProject) => void;
	onDelete: (project: AnimationProject) => void;
};

export default function AnimationProjectCard({ project, onOpen, onRename, onDelete }: AnimationProjectCardProps) {
	return (
		<div className='rounded-xl border border-slate-700 bg-slate-800 p-5'>
			<h2 className='text-lg font-semibold text-white'>{project.name}</h2>

			<p className='mt-2 text-sm text-slate-400'>
				{project.width} × {project.height}
			</p>

			<p className='mt-1 text-sm text-slate-400'>{project.fps} FPS</p>

			<div className='mt-5 flex flex-wrap gap-2'>
				<button
					type='button'
					onClick={() => onOpen(project.id)}
					className='rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white'
				>
					Open Editor
				</button>

				<button
					type='button'
					onClick={() => onRename(project)}
					className='rounded-lg bg-slate-700 px-3 py-2 text-sm text-white'
				>
					Rename
				</button>

				<button
					type='button'
					onClick={() => onDelete(project)}
					className='rounded-lg bg-red-600 px-3 py-2 text-sm text-white'
				>
					Delete
				</button>
			</div>
		</div>
	);
}
