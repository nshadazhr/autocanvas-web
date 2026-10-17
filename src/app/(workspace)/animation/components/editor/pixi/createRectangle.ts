import { Graphics } from 'pixi.js';

type RectangleOptions = {
	width: number;
	height: number;
	color: number;
	x: number;
	y: number;
};

export function createRectangle({ width, height, color, x, y }: RectangleOptions): Graphics {
	const rectangle = new Graphics().rect(0, 0, width, height).fill(color);

	rectangle.position.set(x, y);

	return rectangle;
}
