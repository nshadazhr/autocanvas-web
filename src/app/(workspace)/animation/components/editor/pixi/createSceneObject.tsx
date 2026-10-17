import { Container, Graphics } from 'pixi.js';
import type { AnimationCanvasObject } from '../../../types';

export function createSceneObject(object: AnimationCanvasObject): Container {
	let displayObject: Container;

	switch (object.type) {
		case 'rectangle': {
			const rectangle = new Graphics().rect(0, 0, object.width, object.height).fill(object.fillColor ?? 0xff4444);

			displayObject = rectangle;
			break;
		}

		default:
			throw new Error(`Unsupported animation object type: ${object.type}`);
	}

	displayObject.label = object.id;

	displayObject.position.set(object.x, object.y);
	displayObject.rotation = (object.rotation * Math.PI) / 180;
	displayObject.alpha = object.opacity;
	displayObject.visible = object.visible;
	displayObject.zIndex = object.zIndex;

	return displayObject;
}
