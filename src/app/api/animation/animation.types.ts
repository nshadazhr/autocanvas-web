export type AnimationScene = {
	id: number;
	projectId: number;
	name: string;
	sortOrder: number;
	durationMs: number;
	canvasData: unknown | null;
	createdAt: string;
	updatedAt: string;
};

export type AnimationProject = {
	id: number;
	userId: number;
	name: string;
	width: number;
	height: number;
	fps: number;
	createdAt: string;
	updatedAt: string;
	scenes?: AnimationScene[];
};

export type CreateAnimationProjectRequest = {
	name: string;
	width: number;
	height: number;
	fps: number;
};
export type CreateAnimationSceneRequest = {
	name: string;
	sortOrder?: number;
	durationMs?: number;
};

export type UpdateAnimationSceneRequest = Partial<CreateAnimationSceneRequest>;

export type UpdateAnimationProjectRequest = Partial<CreateAnimationProjectRequest>;
