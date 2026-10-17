import api from '../axios';
import type {
	AnimationProject,
	AnimationScene,
	CreateAnimationProjectRequest,
	CreateAnimationSceneRequest,
	UpdateAnimationProjectRequest,
	UpdateAnimationSceneRequest
} from './animation.types';

// CREATE PROJECT
export const createAnimationProject = async (data: CreateAnimationProjectRequest): Promise<AnimationProject> => {
	const response = await api.post<AnimationProject>('/animation/projects', data);

	return response.data;
};

// GET ALL PROJECTS
export const getAnimationProjects = async (): Promise<AnimationProject[]> => {
	const response = await api.get<AnimationProject[]>('/animation/projects');

	return response.data;
};

// GET SINGLE PROJECT
export const getAnimationProjectById = async (projectId: number): Promise<AnimationProject> => {
	const response = await api.get<AnimationProject>(`/animation/projects/${projectId}`);

	return response.data;
};

// UPDATE PROJECT
export const updateAnimationProject = async (
	projectId: number,
	data: UpdateAnimationProjectRequest
): Promise<AnimationProject> => {
	const response = await api.patch<AnimationProject>(`/animation/projects/${projectId}`, data);

	return response.data;
};

// DELETE PROJECT
export const deleteAnimationProject = async (projectId: number): Promise<{ success: boolean; message: string }> => {
	const response = await api.delete(`/animation/projects/${projectId}`);

	return response.data;
};

// CREATE SCENE
export const createAnimationScene = async (
	projectId: number,
	data: CreateAnimationSceneRequest
): Promise<AnimationScene> => {
	const response = await api.post<AnimationScene>(`/animation/projects/${projectId}/scenes`, data);

	return response.data;
};

// GET ALL SCENES
export const getAnimationScenes = async (projectId: number): Promise<AnimationScene[]> => {
	const response = await api.get<AnimationScene[]>(`/animation/projects/${projectId}/scenes`);

	return response.data;
};

// GET SINGLE SCENE
export const getAnimationSceneById = async (projectId: number, sceneId: number): Promise<AnimationScene> => {
	const response = await api.get<AnimationScene>(`/animation/projects/${projectId}/scenes/${sceneId}`);

	return response.data;
};

// UPDATE SCENE
export const updateAnimationScene = async (
	projectId: number,
	sceneId: number,
	data: UpdateAnimationSceneRequest
): Promise<AnimationScene> => {
	const response = await api.patch<AnimationScene>(`/animation/projects/${projectId}/scenes/${sceneId}`, data);

	return response.data;
};

// DELETE SCENE
export const deleteAnimationScene = async (
	projectId: number,
	sceneId: number
): Promise<{ success: boolean; message: string }> => {
	const response = await api.delete<{
		success: boolean;
		message: string;
	}>(`/animation/projects/${projectId}/scenes/${sceneId}`);

	return response.data;
};
