'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import {
	analyzeAudioStory,
	getAudioStoryById,
	getStoryCast,
	updateAudioStory
} from '../../../../api/audio-studio/audio-stories.api';

import type { AudioStory } from '../../../../api/audio-studio/audio-stories.types';
import { ScenesPanel } from './scenes-panel';
import { SingleVoiceStudio } from '../../single-voice-studio';
import { AudioGenerationPanel } from '../../audio-generation/audio-generation-panel';
type EditorTab = 'script' | 'scenes' | 'generate';

const tabs: { id: EditorTab; label: string }[] = [
	{ id: 'script', label: 'Script' },
	{ id: 'scenes', label: 'Scenes' },
	{ id: 'generate', label: 'Generate Audio' }
];

export default function StoryDetailsPage() {
	const params = useParams();
	const storyId = Number(params.storyId);

	const [story, setStory] = useState<AudioStory | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	const [activeTab, setActiveTab] = useState<EditorTab>('script');

	const [isEditing, setIsEditing] = useState(false);
	const [editTitle, setEditTitle] = useState('');
	const [editContent, setEditContent] = useState('');

	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState('');

	const [analyzing, setAnalyzing] = useState(false);
	const [analyzeError, setAnalyzeError] = useState('');

	const [allVoicesSelected, setAllVoicesSelected] = useState(false);
	const [checkingVoices, setCheckingVoices] = useState(true);

	// Load story
	useEffect(() => {
		let active = true;

		async function loadStory() {
			if (!Number.isSafeInteger(storyId) || storyId <= 0) {
				setError('Invalid story ID.');
				setLoading(false);
				return;
			}

			setLoading(true);
			setError('');

			try {
				const data = await getAudioStoryById(storyId);

				if (active) {
					setStory(data);
				}
			} catch {
				if (active) {
					setError('Failed to load story.');
				}
			} finally {
				if (active) {
					setLoading(false);
				}
			}
		}

		loadStory();

		return () => {
			active = false;
		};
	}, [storyId]);

	// Poll analysis status
	useEffect(() => {
		if (!story || story.analysisStatus !== 'PROCESSING') {
			return;
		}

		const currentStoryId = story.id;
		let active = true;

		const interval = setInterval(async () => {
			try {
				const updatedStory = await getAudioStoryById(currentStoryId);

				if (active) {
					setStory(updatedStory);
				}
			} catch (error) {
				console.error('Failed to refresh analysis status:', error);
			}
		}, 3000);

		return () => {
			active = false;
			clearInterval(interval);
		};
	}, [story?.id, story?.analysisStatus]);

	// Edit story
	const handleEdit = () => {
		if (!story) return;

		setEditTitle(story.title);
		setEditContent(story.content);
		setSaveError('');
		setActiveTab('script');
		setIsEditing(true);
	};

	const handleCancel = () => {
		setSaveError('');
		setIsEditing(false);
	};

	// Save story
	const handleSave = async () => {
		if (!story || saving) return;

		const title = editTitle.trim();
		const content = editContent.trim();

		if (!title || !content) {
			setSaveError('Title and story content are required.');
			return;
		}

		setSaving(true);
		setSaveError('');

		try {
			const updatedStory = await updateAudioStory(story.id, {
				title,
				content
			});

			setStory(updatedStory);
			setIsEditing(false);
		} catch {
			setSaveError('Failed to save story. Please try again.');
		} finally {
			setSaving(false);
		}
	};

	// Analyze story
	const handleAnalyze = async () => {
		if (!story || analyzing || isEditing) return;

		setAnalyzing(true);
		setAnalyzeError('');

		try {
			await analyzeAudioStory(story.id);
			const updatedStory = await getAudioStoryById(story.id);
			setStory(updatedStory);
		} catch (error) {
			console.error('Story analysis failed:', error);
			setAnalyzeError('Failed to analyze story. Please try again.');
		} finally {
			setAnalyzing(false);
		}
	};

	useEffect(() => {
		if (activeTab !== 'generate') return;

		let cancelled = false;

		async function checkVoices() {
			setCheckingVoices(true);
			setAllVoicesSelected(false);

			try {
				const savedCast = await getStoryCast(storyId);
				if (cancelled) return;

				const detectedCharacters =
					story?.analysisStatus === 'COMPLETED' && story.analysisResult?.validation.valid === true
						? story.analysisResult.characters
						: [];

				const savedMap = new Map(savedCast.map(character => [character.name, character]));

				const allSelected =
					detectedCharacters.length > 0 &&
					detectedCharacters.every(character => {
						const saved = savedMap.get(character.name);
						return saved != null && Number(saved.voiceId) > 0;
					});

				setAllVoicesSelected(allSelected);
			} catch (error) {
				console.error('Unable to verify saved voices:', error);
				if (!cancelled) setAllVoicesSelected(false);
			} finally {
				if (!cancelled) setCheckingVoices(false);
			}
		}

		void checkVoices();

		return () => {
			cancelled = true;
		};
	}, [activeTab, storyId, story?.analysisResult, story?.analysisStatus]);

	if (loading) {
		return <p className='text-slate-400'>Loading story...</p>;
	}

	if (error || !story) {
		return <p className='text-red-400'>{error || 'Story not found.'}</p>;
	}

	if (story?.status?.startsWith('SINGLE_')) {
		return (
			<div className='mx-auto w-full max-w-[1800px] space-y-5'>
				<Link href='/audio' className='text-sm text-indigo-300'>
					← Back to Audio Studio
				</Link>
				<h1 className='text-2xl font-bold text-white'>{story.title}</h1>
				<SingleVoiceStudio storyId={storyId} />
			</div>
		);
	}

	const analysisCompleted = story.analysisStatus === 'COMPLETED' && story.analysisResult?.validation.valid === true;

	const analysisResult = analysisCompleted ? story.analysisResult : null;

	return (
		<div className='flex h-full min-h-0 min-w-0 flex-col gap-4 overflow-hidden text-slate-100 sm:gap-6 [&>a]:shrink-0'>
			{/* Back Navigation */}
			<Link href='/audio' className='w-fit text-sm text-indigo-400 hover:text-indigo-300'>
				← Back to Audio Studio
			</Link>

			{/* Story Header */}
			<div className='flex min-w-0 shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
				<div className='min-w-0 lg:flex-1'>
					{isEditing ? (
						<input
							aria-label='Story title'
							value={editTitle}
							onChange={e => setEditTitle(e.target.value)}
							className='min-w-0 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-lg font-bold text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 sm:text-xl'
						/>
					) : (
						<h1 className='break-words text-xl font-bold text-white sm:text-2xl'>{story.title}</h1>
					)}

					<p className='mt-2 text-sm text-slate-400'>Analysis Status: {story.analysisStatus}</p>
				</div>

				<div className='grid grid-cols-2 gap-3 [&>button]:min-h-11 [&>button]:px-3 lg:flex lg:shrink-0 lg:items-center lg:[&>button]:px-4'>
					{!isEditing ? (
						<>
							<button
								type='button'
								onClick={handleEdit}
								disabled={analyzing || story.analysisStatus === 'PROCESSING'}
								className='rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50'
							>
								Edit Story
							</button>

							<button
								type='button'
								onClick={handleAnalyze}
								disabled={analyzing || story.analysisStatus === 'PROCESSING'}
								className='rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50'
							>
								{analyzing || story.analysisStatus === 'PROCESSING'
									? 'Analyzing...'
									: story.analysisStatus === 'COMPLETED'
										? 'Re-analyze Story'
										: 'Analyze Story'}
							</button>
						</>
					) : (
						<>
							<button
								type='button'
								onClick={handleCancel}
								disabled={saving}
								className='rounded-lg border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-50'
							>
								Cancel
							</button>

							<button
								type='button'
								onClick={handleSave}
								disabled={saving}
								className='rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50'
							>
								{saving ? 'Saving...' : 'Save Changes'}
							</button>
						</>
					)}
				</div>
			</div>

			{/* Errors */}
			{saveError && <p className='text-sm text-red-400'>{saveError}</p>}

			{analyzeError && <p className='text-sm text-red-400'>{analyzeError}</p>}

			{/* Editor Tabs */}
			<div
				role='tablist'
				aria-label='Audio Studio editor sections'
				className='flex shrink-0 gap-2 overflow-x-auto border-b border-white/10 pb-3'
			>
				{tabs.map(tab => {
					const selected = activeTab === tab.id;

					const count = tab.id === 'scenes' ? analysisResult?.scenes.length : undefined;

					return (
						<button
							key={tab.id}
							type='button'
							role='tab'
							id={`audio-tab-${tab.id}`}
							aria-selected={selected}
							aria-controls={`audio-panel-${tab.id}`}
							onClick={() => setActiveTab(tab.id)}
							className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors sm:px-4 ${
								selected
									? 'bg-indigo-600 text-white'
									: 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
							}`}
						>
							{tab.label}
							{count !== undefined ? ` (${count})` : ''}
						</button>
					);
				})}
			</div>

			{/* Script Tab */}
			{activeTab === 'script' && (
				<div
					key='script'
					id='audio-panel-script'
					role='tabpanel'
					aria-labelledby='audio-tab-script'
					className='flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto'
				>
					<section className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6'>
						<h2 className='mb-4 shrink-0 text-lg font-semibold text-white'>Original Story</h2>
						{isEditing ? (
							<textarea
								aria-label='Story content'
								value={editContent}
								onChange={e => setEditContent(e.target.value)}
								className='min-h-0 w-full flex-1 resize-none overflow-y-auto overscroll-contain rounded-lg border border-white/10 bg-white/5 p-3 text-base leading-7 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 sm:p-4 lg:h-auto lg:min-h-0 lg:flex-1 lg:resize-none lg:text-sm'
							/>
						) : (
							<div className='min-h-0 flex-1 overflow-y-auto overscroll-contain whitespace-pre-wrap break-words pr-2 text-sm leading-7 text-slate-300'>
								{story.content}
							</div>
						)}
					</section>

					{story.analysisStatus === 'FAILED' && (
						<div className='rounded-xl border border-red-500/20 bg-red-500/5 p-5'>
							<h3 className='font-semibold text-red-400'>Story Analysis Failed</h3>

							<p className='mt-2 text-sm text-slate-300'>
								{story.analysisError || 'Unable to analyze story. Please try again.'}
							</p>
						</div>
					)}

					{story.analysisStatus === 'COMPLETED' && story.analysisResult?.validation.valid === false && (
						<div className='rounded-xl border border-amber-500/20 bg-amber-500/5 p-5'>
							<h3 className='font-semibold text-amber-400'>Invalid Analysis Result</h3>

							<ul className='mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300'>
								{story.analysisResult.validation.errors.map((error, index) => (
									<li key={index}>{error}</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}

			{/* Scenes and voice assignment */}
			{activeTab === 'scenes' && (
				<div key='scenes' className='flex min-h-0 flex-1 flex-col overflow-hidden' id='audio-panel-scenes' role='tabpanel' aria-labelledby='audio-tab-scenes'>
					{analysisResult ? (
						<ScenesPanel
							storyId={story.id}
							scenes={analysisResult.scenes}
							characters={analysisResult.characters}
							onCastSaved={() => {
								setAllVoicesSelected(false);
								setCheckingVoices(true);
							}}
						/>
					) : (
						<EmptyAnalysis message='Analyze your story to view scenes and assign voices.' />
					)}
				</div>
			)}

			{/* Generate Audio Tab */}
			{activeTab === 'generate' && (
				<div key='generate' className='min-h-0 flex-1 overflow-hidden' id='audio-panel-generate' role='tabpanel' aria-labelledby='audio-tab-generate'>
					{analysisResult ? (
						<AudioGenerationPanel
							storyId={storyId}
							allVoicesSelected={allVoicesSelected && !checkingVoices}
						/>
					) : (
						<EmptyAnalysis message='Complete story analysis before generating audio.' />
					)}
				</div>
			)}
		</div>
	);
}

function EmptyAnalysis({ message }: { message: string }) {
	return (
		<div className='rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center'>
			<p className='text-sm text-slate-400'>{message}</p>
		</div>
	);
}
