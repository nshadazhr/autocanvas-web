import { Container, Graphics } from 'pixi.js';
import type { AnimationCanvasObject } from '../../../types';

import { createSceneObject } from './createSceneObject';
import { makeDraggable } from './makeDraggable';

export function renderScene(
	sceneContainer: Container,
	objects: AnimationCanvasObject[],
	onSelect?: (object: AnimationCanvasObject) => void,
	onObjectUpdate?: (id: string, updates: Partial<AnimationCanvasObject>) => void,
	selectedObjectId?: string | null
): void {
	// Remove previous drag listeners from the container
	sceneContainer.removeAllListeners();

	// Remove old objects
	sceneContainer.removeChildren().forEach(child => {
		child.removeAllListeners();
		child.destroy();
	});

	sceneContainer.sortableChildren = true;
	sceneContainer.eventMode = 'static';
	sceneContainer.interactiveChildren = true;

	// Render each object only once
	for (const object of objects) {
		if (object.type !== 'rectangle') continue;

		const pixiObject = createSceneObject(object);
		if (object.id === selectedObjectId) {
			const graphics = pixiObject as Graphics;

			graphics.rect(0, 0, object.width, object.height).stroke({
				color: 0x2563eb,
				width: 4
			});
		}

		sceneContainer.addChild(pixiObject);

		// Enable dragging
		if (!object.locked) {
			makeDraggable(pixiObject, sceneContainer, (x, y) => {
				onObjectUpdate?.(object.id, { x, y });
			});
		}

		// Enable selection
		pixiObject.on('pointertap', event => {
			event.stopPropagation();

			onSelect?.({
				...object,
				x: pixiObject.x,
				y: pixiObject.y
			});
		});
	}

	sceneContainer.sortChildren();
}
