'use client';

import { useEffect, useState } from 'react';
import CreateAnimationModal from '../../(workspace)/animation/components/CreateAnimationModal';
import type { CreateAnimationInput } from '../../(workspace)/animation/types';
import {
	createAnimationProject,
	deleteAnimationProject,
	getAnimationProjects,
	updateAnimationProject
} from '../../api/animation/animation.api';
import type { AnimationProject } from '../../api/animation/animation.types';
import AnimationProjectCard from '../../(workspace)/animation/components/AnimationProjectCard';
import { useRouter } from 'next/navigation';

export default function AnimationDashboardPage() {
	const router = useRouter();
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [projects, setProjects] = useState<AnimationProject[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchProjects = async () => {
		try {
			setError(null);

			const data = await getAnimationProjects();

			setProjects(data);
		} catch (error) {
			console.error('Failed to fetch animation projects:', error);
			setError('Failed to load animation projects.');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		void fetchProjects();
	}, []);

	const handleCreateAnimation = async (data: CreateAnimationInput) => {
		if (isCreating) return;

		try {
			setIsCreating(true);
			setError(null);

			await createAnimationProject(data);

			setIsCreateModalOpen(false);

			await fetchProjects();
		} catch (error) {
			console.error('Failed to create animation project:', error);
			setError('Failed to create animation project.');
		} finally {
			setIsCreating(false);
		}
	};

	const [isProjectActionLoading, setIsProjectActionLoading] = useState(false);

	const handleOpenProject = (projectId: number) => {
		router.push(`/animation/${projectId}`);
	};
	const handleRenameProject = async (project: AnimationProject) => {
		if (isProjectActionLoading) return;

		const newName = window.prompt('Enter new project name:', project.name);

		if (newName === null || newName.trim() === '') return;

		if (newName.trim() === project.name) return;

		try {
			setIsProjectActionLoading(true);
			setError(null);

			const updatedProject = await updateAnimationProject(project.id, {
				name: newName.trim()
			});

			setProjects(previousProjects =>
				previousProjects.map(item => (item.id === updatedProject.id ? updatedProject : item))
			);
		} catch (error) {
			console.error('Failed to rename animation project:', error);
			setError('Failed to rename animation project.');
		} finally {
			setIsProjectActionLoading(false);
		}
	};

	const handleDeleteProject = async (project: AnimationProject) => {
		if (isProjectActionLoading) return;

		const confirmed = window.confirm(`Delete "${project.name}" and all its scenes? This cannot be undone.`);

		if (!confirmed) return;

		try {
			setIsProjectActionLoading(true);
			setError(null);

			await deleteAnimationProject(project.id);

			setProjects(previousProjects => previousProjects.filter(item => item.id !== project.id));
		} catch (error) {
			console.error('Failed to delete animation project:', error);
			setError('Failed to delete animation project.');
		} finally {
			setIsProjectActionLoading(false);
		}
	};
	return (
		<main className='space-y-6 p-6'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-semibold text-white'>Animation Studio</h1>

					<p className='mt-2 text-sm text-slate-400'>Create and manage your 2D animation projects.</p>
				</div>

				<button
					type='button'
					onClick={() => setIsCreateModalOpen(true)}
					disabled={isCreating}
					className='rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50'
				>
					Create Animation
				</button>
			</div>

			{error && (
				<p role='alert' className='text-sm text-red-400'>
					{error}
				</p>
			)}

			{isLoading ? (
				<p className='text-sm text-slate-400'>Loading projects...</p>
			) : projects.length === 0 ? (
				<p className='text-sm text-slate-400'>No animation projects yet. Create your first animation.</p>
			) : (
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
					{projects.map(project => (
						<AnimationProjectCard
							key={project.id}
							project={project}
							onOpen={handleOpenProject}
							onRename={handleRenameProject}
							onDelete={handleDeleteProject}
						/>
					))}
				</div>
			)}

			<CreateAnimationModal
				isOpen={isCreateModalOpen}
				onClose={() => {
					if (!isCreating) {
						setIsCreateModalOpen(false);
					}
				}}
				onCreate={handleCreateAnimation}
			/>
		</main>
	);
}
