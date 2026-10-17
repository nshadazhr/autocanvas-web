'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { createAnimationScene, getAnimationProjectById } from '@/src/app/api/animation/animation.api';

import type { AnimationProject, AnimationScene } from '@/src/app/api/animation/animation.types';

import { useAnimation } from '../hooks/useAnimation';

import AnimationEditorLayout from '../components/editor/AnimationEditorLayout';
import EditorToolbar from '../components/editor/EditorToolbar';
import AssetsPanel from '../components/editor/AssetsPanel';
import CanvasWorkspace from '../components/editor/CanvasWorkspace';
import InspectorPanel from '../components/editor/InspectorPanel';
import TimelinePanel from '../components/editor/TimelinePanel';
import type { AnimationCanvasObject, SelectedObject } from '../types';
import { addSceneObject, updateSceneObject, deleteSceneObject } from '../utils/sceneObject.utils';

const testSceneObjects: AnimationCanvasObject[] = [
	{
		id: 'rect-2',
		type: 'rectangle',
		name: 'Blue Rectangle',
		x: 100,
		y: 100,
		width: 250,
		height: 150,
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		zIndex: 1,
		fillColor: 0x3b82f6
	},
	{
		id: 'rect-3',
		type: 'rectangle',
		name: 'Green Rectangle',
		x: 400,
		y: 250,
		width: 180,
		height: 180,
		rotation: 0,
		opacity: 1,
		visible: true,
		locked: false,
		zIndex: 2,
		fillColor: 0x22c55e
	}
];

export default function AnimationEditorPage() {
	const { projectId } = useParams<{ projectId: string }>();
	const router = useRouter();

	const { setActiveProjectId } = useAnimation();

	const [project, setProject] = useState<AnimationProject | null>(null);
	const [scenes, setScenes] = useState<AnimationScene[]>([]);
	const [activeSceneId, setActiveSceneId] = useState<number | null>(null);
	const [selectedObject, setSelectedObject] = useState<SelectedObject | null>(null);
	const [sceneObjects, setSceneObjects] = useState<AnimationCanvasObject[]>(testSceneObjects);

	const [isLoading, setIsLoading] = useState(true);
	const [isCreatingScene, setIsCreatingScene] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const handleSceneObjectUpdate = useCallback((id: string, updates: Partial<AnimationCanvasObject>) => {
		setSceneObjects(prev => updateSceneObject(prev, id, updates));

		setSelectedObject(prev => {
			if (!prev || prev.id !== id) return prev;

			return {
				...prev,
				...(updates.x !== undefined ? { x: updates.x } : {}),
				...(updates.y !== undefined ? { y: updates.y } : {}),
				...(updates.width !== undefined ? { width: updates.width } : {}),
				...(updates.height !== undefined ? { height: updates.height } : {})
			};
		});
	}, []);

	useEffect(() => {
		const id = Number(projectId);

		if (!Number.isSafeInteger(id) || id <= 0) {
			setError('Invalid animation project ID.');
			setIsLoading(false);
			return;
		}

		let cancelled = false;

		const loadProject = async () => {
			try {
				setIsLoading(true);
				setError(null);

				const data = await getAnimationProjectById(id);

				if (cancelled) return;

				const loadedScenes = data.scenes ?? [];

				setProject(data);
				setScenes(loadedScenes);
				setActiveSceneId(loadedScenes[0]?.id ?? null);
				setActiveProjectId(data.id);
			} catch (err) {
				if (cancelled) return;

				console.error('Failed to load project:', err);
				setError('Failed to load animation project.');
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		};

		void loadProject();

		return () => {
			cancelled = true;
			setActiveProjectId(null);
		};
	}, [projectId, setActiveProjectId]);

	const handleAddScene = async () => {
		if (!project || isCreatingScene) return;

		try {
			setIsCreatingScene(true);
			setError(null);

			const nextOrder = scenes.length > 0 ? Math.max(...scenes.map(scene => scene.sortOrder)) + 1 : 0;

			const newScene = await createAnimationScene(project.id, {
				name: `Scene ${scenes.length + 1}`,
				sortOrder: nextOrder,
				durationMs: 5000
			});

			setScenes(previous => [...previous, newScene]);
			setActiveSceneId(newScene.id);
		} catch (err) {
			console.error('Failed to create scene:', err);
			setError('Failed to create animation scene.');
		} finally {
			setIsCreatingScene(false);
		}
	};

	const handleUpdateObject = (updates: Partial<SelectedObject>) => {
		if (!selectedObject) return;

		setSelectedObject(prev => (prev ? { ...prev, ...updates } : null));

		if (selectedObject.id !== 'rectangle-1') {
			handleSceneObjectUpdate(selectedObject.id, updates);
		}
	};

	const handleDeleteObject = () => {
		if (!selectedObject) return;

		// Temporary red test rectangle ko delete nahi karenge
		if (selectedObject.id === 'rectangle-1') return;

		setSceneObjects(prev => deleteSceneObject(prev, selectedObject.id));

		setSelectedObject(null);
	};

	if (isLoading) {
		return <div className='p-6 text-slate-300'>Loading Animation Editor...</div>;
	}

	if (!project) {
		return (
			<div className='p-6'>
				<p className='text-red-400'>{error ?? 'Animation project not found.'}</p>

				<button
					type='button'
					onClick={() => router.push('/animation')}
					className='mt-4 text-sm text-indigo-400'
				>
					← Back to Projects
				</button>
			</div>
		);
	}

	const handleAddObject = () => {
		const newObject: AnimationCanvasObject = {
			id: crypto.randomUUID(),
			type: 'rectangle',
			name: `Rectangle ${sceneObjects.length + 1}`,
			x: 150,
			y: 150,
			width: 200,
			height: 120,
			rotation: 0,
			opacity: 1,
			visible: true,
			locked: false,
			zIndex: sceneObjects.length + 1,
			fillColor: 0xf59e0b
		};

		setSceneObjects(prev => addSceneObject(prev, newObject));
	};

	return (
		<div className='flex h-[calc(100vh-64px)] min-h-0 flex-col'>
			{error && (
				<p role='alert' className='bg-red-950 px-4 py-2 text-sm text-red-300'>
					{error}
				</p>
			)}

			<div className='min-h-0 flex-1'>
				<AnimationEditorLayout
					toolbar={<EditorToolbar projectName={project.name} onBack={() => router.push('/animation')} />}
					assetsPanel={<AssetsPanel onAddRectangle={handleAddObject} />}
					canvas={
						<CanvasWorkspace
							width={project.width}
							height={project.height}
							objects={sceneObjects}
							selectedObject={selectedObject}
							onSelectObject={setSelectedObject}
							onObjectUpdate={handleSceneObjectUpdate}
						/>
					}
					inspector={
						<InspectorPanel
							selectedObject={selectedObject}
							onUpdateObject={handleUpdateObject}
							onDeleteObject={handleDeleteObject}
						/>
					}
					timeline={
						<TimelinePanel
							scenes={scenes}
							activeSceneId={activeSceneId}
							onSceneSelect={setActiveSceneId}
							onAddScene={() => {
								if (!isCreatingScene) {
									void handleAddScene();
								}
							}}
						/>
					}
				/>
			</div>
		</div>
	);
}
