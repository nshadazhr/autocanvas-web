'use client';

import { useEffect } from 'react';

type Props = {
	open: boolean;
	loading?: boolean;
	onConfirm: () => void;
	onClose: () => void;
	sceneNumber?: number;
	action?: 'generate' | 'retry' | 'regenerate';
};

export function RegenerationConfirmModal({ open, loading = false, sceneNumber, action = 'regenerate', onConfirm, onClose }: Props) {
	const verb = action === 'generate' ? 'Generate' : action === 'retry' ? 'Retry' : 'Regenerate';
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
					{sceneNumber !== undefined ? `${verb} Scene ${sceneNumber}?` : 'Regenerate All Audio?'}
				</h2>

				<p id='regeneration-modal-description' className='mt-3 text-sm leading-6 text-slate-300'>
					{sceneNumber !== undefined
						? `This will generate audio for Scene ${sceneNumber}. Other scenes will remain unchanged.`
						: 'This will generate new audio for all scenes. Previously saved audio will be kept.'}
				</p>

				<div className='mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3'>
					<p className='text-sm text-amber-300'>
						This uses your audio generation allowance. Previously saved audio will be kept.
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
						{loading ? 'Starting...' : sceneNumber !== undefined ? `${verb} Scene` : 'Regenerate All'}
					</button>
				</div>
			</div>
		</div>
	);
}
