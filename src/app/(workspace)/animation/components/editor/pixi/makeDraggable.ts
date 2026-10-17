import { Container } from 'pixi.js';

export function makeDraggable(
	object: Container,
	stage: Container,
	onDragEnd?: (x: number, y: number) => void
): () => void {
	let dragging = false;
	let offsetX = 0;
	let offsetY = 0;

	object.eventMode = 'static';
	object.cursor = 'grab';

	const onPointerDown = (event: any) => {
		dragging = true;

		const position = event.getLocalPosition(stage);

		offsetX = position.x - object.x;
		offsetY = position.y - object.y;

		object.cursor = 'grabbing';
	};

	const onPointerMove = (event: any) => {
		if (!dragging) return;

		const position = event.getLocalPosition(stage);

		object.position.set(position.x - offsetX, position.y - offsetY);
	};

	const stopDragging = () => {
		if (!dragging) return;

		dragging = false;
		object.cursor = 'grab';

		onDragEnd?.(object.x, object.y);
	};

	object.on('pointerdown', onPointerDown);
	stage.on('globalpointermove', onPointerMove);
	stage.on('pointerup', stopDragging);
	stage.on('pointerupoutside', stopDragging);

	return () => {
		object.off('pointerdown', onPointerDown);
		stage.off('globalpointermove', onPointerMove);
		stage.off('pointerup', stopDragging);
		stage.off('pointerupoutside', stopDragging);
	};
}
