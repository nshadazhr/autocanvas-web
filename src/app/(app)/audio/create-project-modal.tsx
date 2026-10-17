'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { createAudioStory } from '../../api/audio-studio/audio-stories.api';

interface CreateProjectModalProps {
	open: boolean;
	onClose: () => void;
}

export function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		if (open) {
			setTitle('');
			setContent('');
			setError('');
		}
	}, [open]);

	useEffect(() => {
		if (!open || loading) return;

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				onClose();
			}
		}

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [open, loading, onClose]);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const storyTitle = title.trim();
		const storyContent = content.trim();

		if (!storyTitle || !storyContent) {
			setError('Story title and content are required.');
			return;
		}

		setLoading(true);
		setError('');

		try {
			await createAudioStory({
				title: storyTitle,
				content: storyContent
			});

			onClose();

			// Refresh My Stories after successful creation.
			window.location.reload();
		} catch (err) {
			console.error('Create story failed:', err);
			setError('Failed to create story. Please try again.');
		} finally {
			setLoading(false);
		}
	}

	if (!open) return null;

	return (
		<div
			className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4'
			onClick={() => {
				if (!loading) onClose();
			}}
		>
			<div
				role='dialog'
				aria-modal='true'
				aria-labelledby='create-story-title'
				onClick={event => event.stopPropagation()}
				className='max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#10131f] p-8 shadow-2xl'
			>
				{/* Header */}
				<div className='flex items-start justify-between'>
					<div className='flex items-center gap-4'>
						<span className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-2xl'>
							🎵
						</span>

						<div>
							<h1 id='create-story-title' className='text-xl font-bold text-white'>
								Create New Story
							</h1>

							<p className='text-sm text-slate-400'>
								Write or paste your story to start your audio project.
							</p>
						</div>
					</div>

					<button
						type='button'
						onClick={onClose}
						disabled={loading}
						aria-label='Close modal'
						className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-50'
					>
						✕
					</button>
				</div>

				<form onSubmit={handleSubmit}>
					{/* Story Title */}
					<div className='mt-7'>
						<label htmlFor='story-title' className='text-sm font-semibold text-white'>
							Story Title
						</label>

						<p className='mt-0.5 text-xs text-slate-500'>
							Give your story a name so you can find it later.
						</p>

						<div className='mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5'>
							<span className='text-slate-500'>📁</span>

							<input
								id='story-title'
								type='text'
								value={title}
								onChange={event => setTitle(event.target.value)}
								required
								disabled={loading}
								placeholder='e.g. Gaon Mein Pizza Wala'
								className='w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none'
							/>
						</div>
					</div>

					{/* Import Method */}
					<div className='mt-6'>
						<label className='text-sm font-semibold text-white'>Import Method</label>

						<p className='mt-0.5 text-xs text-slate-500'>Choose how you want to add your story.</p>

						<div className='mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2'>
							<div className='flex items-start gap-3 rounded-xl border border-indigo-400/50 bg-indigo-500/10 p-4'>
								<span className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-lg'>
									📝
								</span>

								<div className='flex-1'>
									<p className='text-sm font-semibold text-white'>Paste Story Text</p>

									<p className='mt-0.5 text-xs text-slate-400'>Paste your complete story here.</p>
								</div>

								<span className='mt-1 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-2 border-blue-400'>
									<span className='h-2 w-2 rounded-full bg-blue-400' />
								</span>
							</div>

							<div className='flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 opacity-50'>
								<span className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-lg'>
									🗂️
								</span>

								<div>
									<p className='text-sm font-semibold text-white'>Upload CSV / Script File</p>

									<p className='mt-0.5 text-xs text-slate-400'>Coming soon</p>
								</div>
							</div>
						</div>
					</div>

					{/* Story Content */}
					<div className='mt-6'>
						<label htmlFor='story-content' className='text-sm font-semibold text-white'>
							Story Text
						</label>

						<p className='mt-0.5 text-xs text-slate-500'>
							Paste your complete story. Scene analysis will be available after saving.
						</p>

						<textarea
							id='story-content'
							value={content}
							onChange={event => setContent(event.target.value)}
							rows={8}
							required
							disabled={loading}
							placeholder='Paste or type your story here...'
							className='mt-2 w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none'
						/>
					</div>

					{/* Error */}
					{error && (
						<p role='alert' className='mt-4 text-sm text-red-400'>
							{error}
						</p>
					)}

					{/* Footer */}
					<div className='mt-8 flex items-center justify-end gap-3'>
						<button
							type='button'
							onClick={onClose}
							disabled={loading}
							className='rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-50'
						>
							Cancel
						</button>

						<button
							type='submit'
							disabled={loading || !title.trim() || !content.trim()}
							className='rounded-full bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50'
						>
							{loading ? 'Creating...' : 'Create Story →'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
