export type CreateAnimationInput = {
	name: string;
	width: number;
	height: number;
	fps: number;
};

export type CreateAnimationModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onCreate: (data: CreateAnimationInput) => void;
};

export type SelectedObject = {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
};

export type AnimationObjectType = 'rectangle' | 'image' | 'character' | 'background';

export type AnimationCanvasObject = {
	id: string;
	type: AnimationObjectType;
	name: string;

	x: number;
	y: number;
	width: number;
	height: number;

	rotation: number;
	opacity: number;
	visible: boolean;
	locked: boolean;

	zIndex: number;

	// Image / character assets ke liye
	assetUrl?: string;

	// Shape objects ke liye
	fillColor?: number;
};

export type AnimationCanvasData = {
	version: 1;
	objects: AnimationCanvasObject[];
};
