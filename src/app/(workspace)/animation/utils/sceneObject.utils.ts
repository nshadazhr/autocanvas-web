import type { AnimationCanvasObject } from '../types';

// Add object
export const addSceneObject = (
	objects: AnimationCanvasObject[],
	newObject: AnimationCanvasObject
): AnimationCanvasObject[] => {
	return [...objects, newObject];
};

// Update object
export const updateSceneObject = (
	objects: AnimationCanvasObject[],
	id: string,
	updates: Partial<AnimationCanvasObject>
): AnimationCanvasObject[] => {
	return objects.map(object => (object.id === id ? { ...object, ...updates } : object));
};

// Delete object
export const deleteSceneObject = (objects: AnimationCanvasObject[], id: string): AnimationCanvasObject[] => {
	return objects.filter(object => object.id !== id);
};
