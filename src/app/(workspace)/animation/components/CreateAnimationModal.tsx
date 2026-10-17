'use client';

import { useState } from 'react';
import type { CreateAnimationModalProps } from '../types';
export default function CreateAnimationModal({ isOpen, onClose, onCreate }: CreateAnimationModalProps) {
	const [projectName, setProjectName] = useState('');
	const [resolution, setResolution] = useState('1920x1080');
	const [fps, setFps] = useState(24);

	const handleCreate = () => {
		const name = projectName.trim();

		if (!name) return;

		const [width, height] = resolution.split('x').map(Number);

		onCreate({
			name,
			width,
			height,
			fps
		});

		resetForm();
	};

	const resetForm = () => {
		setProjectName('');
		setResolution('1920x1080');
		setFps(24);
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4'>
			<div
				role='dialog'
				aria-modal='true'
				aria-labelledby='create-animation-title'
				className='w-full max-w-md rounded-xl border border-slate-700 bg-[#1b1b23] p-6 shadow-xl'
			>
				<div className='flex items-center justify-between'>
					<h2 id='create-animation-title' className='text-lg font-semibold text-white'>
						Create Animation
					</h2>

					<button
						type='button'
						onClick={handleClose}
						aria-label='Close modal'
						className='text-slate-400 hover:text-white'
					>
						✕
					</button>
				</div>

				<div className='mt-6 space-y-4'>
					<div>
						<label htmlFor='projectName' className='mb-2 block text-sm text-slate-300'>
							Project Name
						</label>

						<input
							id='projectName'
							value={projectName}
							onChange={e => setProjectName(e.target.value)}
							placeholder='Enter project name'
							className='w-full rounded-lg border border-slate-700 bg-[#252530] px-3 py-2 text-white outline-none focus:border-indigo-500'
						/>
					</div>

					<div>
						<label htmlFor='resolution' className='mb-2 block text-sm text-slate-300'>
							Resolution
						</label>

						<select
							id='resolution'
							value={resolution}
							onChange={e => setResolution(e.target.value)}
							className='w-full rounded-lg border border-slate-700 bg-[#252530] px-3 py-2 text-white'
						>
							<option value='1920x1080'>1920 × 1080 (Full HD)</option>
							<option value='1280x720'>1280 × 720 (HD)</option>
							<option value='3840x2160'>3840 × 2160 (4K)</option>
						</select>
					</div>

					<div>
						<label htmlFor='fps' className='mb-2 block text-sm text-slate-300'>
							Frame Rate (FPS)
						</label>

						<select
							id='fps'
							value={fps}
							onChange={e => setFps(Number(e.target.value))}
							className='w-full rounded-lg border border-slate-700 bg-[#252530] px-3 py-2 text-white'
						>
							<option value={12}>12 FPS</option>
							<option value={24}>24 FPS</option>
							<option value={30}>30 FPS</option>
							<option value={60}>60 FPS</option>
						</select>
					</div>
				</div>

				<button
					onClick={handleCreate}
					type='button'
					disabled={!projectName.trim()}
					className='mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50'
				>
					Create Project
				</button>
			</div>
		</div>
	);
}
