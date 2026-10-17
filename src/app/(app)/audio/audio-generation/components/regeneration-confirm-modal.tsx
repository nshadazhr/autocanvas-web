'use client';

import { useEffect } from 'react';

type Props = {
	open: boolean;
	loading?: boolean;
	onConfirm: () => void;
	onClose: () => void;
	sceneNumber?: number;
};

export function RegenerationConfirmModal({ open, loading = false, sceneNumber, onConfirm, onClose }: Props) {
	useEffect(() => {
		if (!open) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && !loading) {
				onClose();
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [open, loading, onClose]);

	if (!open) return null;

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4' role='presentation'>
			<div
				role='dialog'
				aria-modal='true'
				aria-labelledby='regeneration-modal-title'
				aria-describedby='regeneration-modal-description'
				className='w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl'
			>
				<h2 id='regeneration-modal-title' className='text-lg font-semibold text-white'>
					{sceneNumber !== undefined ? `Regenerate Scene ${sceneNumber}?` : 'Regenerate All Audio?'}
				</h2>

				<p id='regeneration-modal-description' className='mt-3 text-sm leading-6 text-slate-300'>
					{sceneNumber !== undefined
						? `This will start a new audio generation job for Scene ${sceneNumber}. Other scenes will remain unchanged. Please download any audio you want to keep before continuing.`
						: 'This will start a new audio generation job for all scenes. Please download any audio you want to keep before continuing.'}
				</p>

				<div className='mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3'>
					<p className='text-sm text-amber-300'>
						Existing audio replacement and automatic Trash cleanup are not enabled yet.
					</p>
				</div>

				<div className='mt-6 flex justify-end gap-3'>
					<button
						type='button'
						onClick={onClose}
						disabled={loading}
						className='rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50'
					>
						Cancel
					</button>

					<button
						type='button'
						onClick={onConfirm}
						disabled={loading}
						className='rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50'
					>
						{loading ? 'Starting...' : sceneNumber !== undefined ? 'Regenerate Scene' : 'Regenerate All'}
					</button>
				</div>
			</div>
		</div>
	);
}
