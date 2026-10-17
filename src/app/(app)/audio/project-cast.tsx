'use client';

import { useEffect, useState } from 'react';
import type { AudioStoryCharacter, Voice } from '../../api/audio-studio/audio-stories.types';
import { getVoices } from '../../api/audio-studio/voices.api';
import { getStoryCast, updateStoryCast } from '../../api/audio-studio/audio-stories.api';

interface CastMember extends AudioStoryCharacter {
	voiceId: string;
}

interface ProjectCastProps {
	storyId: number;
	characters: AudioStoryCharacter[];
	compact?: boolean;
}

export function ProjectCast({ storyId, characters, compact = false }: ProjectCastProps) {
	const [cast, setCast] = useState<CastMember[]>([]);
	const [voices, setVoices] = useState<Voice[]>([]);
	const [loadingVoices, setLoadingVoices] = useState(true);
	const [voicesError, setVoicesError] = useState('');
	const [loadingCast, setLoadingCast] = useState(true);
	const [castError, setCastError] = useState('');
	const [savingCast, setSavingCast] = useState(false);
	const [saveError, setSaveError] = useState('');
	const [saveSuccess, setSaveSuccess] = useState(false);

	// Only reload saved cast when the story or actual character data changes.
	const charactersKey = JSON.stringify(characters);

	useEffect(() => {
		let active = true;
		const detectedCharacters: AudioStoryCharacter[] = JSON.parse(charactersKey);

		async function loadCast() {
			setLoadingCast(true);
			setCastError('');
			setSaveError('');
			setSaveSuccess(false);

			try {
				const savedCast = await getStoryCast(storyId);
				if (!active) return;

				const savedMap = new Map(savedCast.map(character => [character.name, character]));
				setCast(
					detectedCharacters.map(character => {
						const saved = savedMap.get(character.name);
						return {
							...character,
							gender: saved?.gender ?? character.gender,
							voiceId: saved?.voiceId != null ? String(saved.voiceId) : ''
						};
					})
				);
			} catch {
				if (!active) return;
				setCastError('Unable to load saved cast. Please refresh and try again.');
				setCast(detectedCharacters.map(character => ({ ...character, voiceId: '' })));
			} finally {
				if (active) setLoadingCast(false);
			}
		}

		void loadCast();
		return () => {
			active = false;
		};
	}, [storyId, charactersKey]);

	useEffect(() => {
		let active = true;

		async function loadVoices() {
			try {
				const data = await getVoices();
				if (active) {
					setVoices(data);
					setVoicesError('');
				}
			} catch {
				if (active) setVoicesError('Unable to load voices.');
			} finally {
				if (active) setLoadingVoices(false);
			}
		}

		void loadVoices();
		return () => {
			active = false;
		};
	}, []);

	function updateCharacter(name: string, field: 'gender' | 'voiceId', value: string) {
		setSaveSuccess(false);
		setSaveError('');
		setCast(previous =>
			previous.map(character => (character.name === name ? { ...character, [field]: value } : character))
		);
	}

	async function handleSaveCast() {
		if (savingCast || loadingCast || !!castError || cast.length === 0) return;

		setSavingCast(true);
		setSaveError('');
		setSaveSuccess(false);

		try {
			const savedCast = await updateStoryCast(storyId, {
				characters: cast.map(character => ({
					name: character.name,
					gender: character.gender,
					voiceId: character.voiceId ? Number(character.voiceId) : null
				}))
			});

			const savedMap = new Map(savedCast.map(character => [character.name, character]));
			setCast(previous =>
				previous.map(character => {
					const saved = savedMap.get(character.name);
					return saved
						? {
								...character,
								gender: saved.gender ?? character.gender,
								voiceId: saved.voiceId != null ? String(saved.voiceId) : ''
							}
						: character;
				})
			);
			setSaveSuccess(true);
		} catch {
			setSaveError('Unable to save cast. Please try again.');
		} finally {
			setSavingCast(false);
		}
	}

	const selectClassName =
		'w-full min-w-0 rounded-lg border border-slate-600/60 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50';

	return (
		<section
			className={
				compact ? 'text-slate-100' : 'rounded-2xl border border-white/10 bg-[#11131d] p-5 text-slate-100 sm:p-6'
			}
		>
			<div className={compact ? 'sr-only' : 'mb-6'}>
				<h2 className='text-lg font-semibold text-white'>
					Project Cast ({loadingCast ? characters.length : cast.length})
				</h2>
				<p className='mt-1 text-sm text-slate-400'>Review detected characters and assign their voices.</p>
			</div>

			{loadingCast && <p className='mb-4 text-sm text-slate-400'>Loading saved cast...</p>}

			{castError && (
				<p className='mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400'>
					{castError}
				</p>
			)}

			{!loadingCast &&
				(cast.length === 0 ? (
					<p className='text-sm text-slate-400'>No characters detected.</p>
				) : (
					<div className='space-y-3'>
						{cast.map(character => (
							<div
								key={character.name}
								className={
									compact
										? 'grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3'
										: 'grid grid-cols-1 gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:bg-white/[0.06] md:grid-cols-[minmax(0,1fr)_160px_minmax(200px,260px)] md:items-center'
								}
							>
								<div className={compact ? 'col-span-2 min-w-0' : 'min-w-0'}>
									<p className='break-words text-base font-semibold text-white'>{character.name}</p>
									<p className='mt-1 text-xs text-slate-400'>Detected Character</p>
								</div>

								<div className='min-w-0'>
									<label className='mb-2 block text-xs font-medium text-slate-300'>Gender</label>
									<select
										value={character.gender}
										onChange={event =>
											updateCharacter(character.name, 'gender', event.target.value)
										}
										disabled={savingCast || loadingCast || !!castError}
										className={selectClassName}
									>
										{!['Male', 'Female', 'Other'].includes(character.gender) && (
											<option value={character.gender}>{character.gender || 'Unknown'}</option>
										)}
										<option value='Male'>Male</option>
										<option value='Female'>Female</option>
										<option value='Other'>Other</option>
									</select>
								</div>

								<div className='min-w-0'>
									<label className='mb-2 block text-xs font-medium text-slate-300'>Voice</label>
									<select
										value={character.voiceId}
										onChange={event =>
											updateCharacter(character.name, 'voiceId', event.target.value)
										}
										disabled={
											savingCast || loadingCast || loadingVoices || !!voicesError || !!castError
										}
										className={selectClassName}
									>
										<option value=''>{loadingVoices ? 'Loading voices...' : 'Select Voice'}</option>
										{voices.map(voice => (
											<option key={voice.id} value={String(voice.id)}>
												{voice.name}
												{voice.gender ? ` (${voice.gender})` : ''}
											</option>
										))}
									</select>
								</div>
							</div>
						))}
					</div>
				))}

			{voicesError && (
				<p className='mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400'>
					{voicesError}
				</p>
			)}

			<div className='mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5'>
				<div aria-live='polite'>
					{saveError && <p className='text-sm text-red-400'>{saveError}</p>}
					{saveSuccess && <p className='text-sm text-emerald-400'>Cast saved successfully.</p>}
				</div>
				<button
					type='button'
					onClick={handleSaveCast}
					disabled={savingCast || loadingCast || !!castError || cast.length === 0}
					className='rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50'
				>
					{savingCast ? 'Saving...' : 'Save Cast'}
				</button>
			</div>
		</section>
	);
}
