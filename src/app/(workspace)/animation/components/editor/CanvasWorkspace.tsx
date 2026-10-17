'use client';

import { useEffect, useRef, useState } from 'react';
import { Application, Container, Graphics } from 'pixi.js';
import { renderScene } from './pixi/renderScene';
import { createRectangle } from './pixi/createRectangle';
import type { SelectedObject, AnimationCanvasObject } from '../../types';

type CanvasWorkspaceProps = {
	width: number;
	height: number;
	objects: AnimationCanvasObject[];
	selectedObject: SelectedObject | null;
	onSelectObject: (object: SelectedObject | null) => void;
	onObjectUpdate: (id: string, updates: Partial<AnimationCanvasObject>) => void;
};

export default function CanvasWorkspace({
	width,
	height,
	objects,
	selectedObject,
	onSelectObject,
	onObjectUpdate
}: CanvasWorkspaceProps) {
	const canvasContainerRef = useRef<HTMLDivElement>(null);
	const rectangleRef = useRef<Graphics | null>(null);
	const sceneContainerRef = useRef<Container | null>(null);

	const rectangleSizeRef = useRef({
		width: 200,
		height: 120
	});
	useEffect(() => {
		const container = canvasContainerRef.current;

		if (!container || width <= 0 || height <= 0) return;

		const app = new Application();
		let cancelled = false;
		let initialized = false;

		const initializePixi = async () => {
			try {
				await app.init({
					width,
					height,
					backgroundColor: 0xffffff,
					antialias: true,
					resolution: 1,
					autoDensity: true
				});

				initialized = true;

				if (cancelled) {
					app.destroy(true);
					return;
				}

				const rectangle = createRectangle({
					width: 200,
					height: 120,
					color: 0xff4444,
					x: (width - 200) / 2,
					y: (height - 120) / 2
				});

				rectangleRef.current = rectangle;

				// Enable dragging
				rectangle.eventMode = 'static';
				rectangle.cursor = 'grab';

				// Object selection
				let isSelected = false;

				rectangle.on('pointertap', event => {
					event.stopPropagation();

					const { width: currentWidth, height: currentHeight } = rectangleSizeRef.current;

					isSelected = true;

					onSelectObject({
						id: 'rectangle-1',
						x: rectangle.x,
						y: rectangle.y,
						width: currentWidth,
						height: currentHeight
					});

					rectangle
						.clear()
						.rect(0, 0, currentWidth, currentHeight)
						.fill(0xff4444)
						.rect(0, 0, currentWidth, currentHeight)
						.stroke({ color: 0x2563eb, width: 4 });
				});
				let dragging = false;
				let offsetX = 0;
				let offsetY = 0;

				rectangle.on('pointerdown', event => {
					dragging = true;

					const position = event.getLocalPosition(app.stage);

					offsetX = position.x - rectangle.x;
					offsetY = position.y - rectangle.y;

					rectangle.cursor = 'grabbing';
				});

				app.stage.eventMode = 'static';
				app.stage.hitArea = app.screen;

				app.stage.on('globalpointermove', event => {
					if (!dragging) return;

					const position = event.getLocalPosition(app.stage);

					const newX = position.x - offsetX;
					const newY = position.y - offsetY;

					// Update PixiJS object position
					rectangle.position.set(newX, newY);

					// Sync position with React state
					onSelectObject({
						id: 'rectangle-1',
						x: newX,
						y: newY,
						...rectangleSizeRef.current
					});
				});

				const stopDragging = () => {
					dragging = false;
					rectangle.cursor = 'grab';
				};

				app.stage.on('pointerup', stopDragging);
				app.stage.on('pointerupoutside', stopDragging);

				app.stage.addChild(rectangle);

				// Container for dynamic scene objects
				const sceneContainer = new Container();

				sceneContainer.label = 'scene-objects';

				app.stage.addChild(sceneContainer);

				sceneContainerRef.current = sceneContainer;
				renderScene(
					sceneContainer,
					objects,
					object => {
						onSelectObject({
							id: object.id,
							x: object.x,
							y: object.y,
							width: object.width,
							height: object.height
						});
					},
					onObjectUpdate
				);
				app.stage.on('pointertap', event => {
					if (event.target !== app.stage) return;

					isSelected = false;

					const { width: currentWidth, height: currentHeight } = rectangleSizeRef.current;

					rectangle.clear().rect(0, 0, currentWidth, currentHeight).fill(0xff4444);

					onSelectObject(null);
				});

				container.appendChild(app.canvas);
			} catch (error) {
				console.error('Failed to initialize PixiJS:', error);
			}
		};

		void initializePixi();

		return () => {
			cancelled = true;
			rectangleRef.current = null;
			sceneContainerRef.current = null;
			if (initialized) {
				app.destroy(true);
			}
		};
	}, [width, height]);

	useEffect(() => {
		const rectangle = rectangleRef.current;

		if (!rectangle || !selectedObject) return;
		if (selectedObject.id !== 'rectangle-1') return;

		// Update position
		rectangleSizeRef.current = {
			width: selectedObject.width,
			height: selectedObject.height
		};
		rectangle.position.set(selectedObject.x, selectedObject.y);

		// Update size
		rectangle.clear().rect(0, 0, selectedObject.width, selectedObject.height).fill(0xff4444);

		// Keep selection border
		rectangle.rect(0, 0, selectedObject.width, selectedObject.height).stroke({
			color: 0x2563eb,
			width: 4
		});
	}, [selectedObject]);

	useEffect(() => {
		const sceneContainer = sceneContainerRef.current;

		if (!sceneContainer) return;

		renderScene(
			sceneContainer,
			objects,
			object => {
				onSelectObject({
					id: object.id,
					x: object.x,
					y: object.y,
					width: object.width,
					height: object.height
				});
			},
			onObjectUpdate,
			selectedObject?.id
		);
	}, [objects, onSelectObject, onObjectUpdate, selectedObject?.id]);

	return (
		<div className='flex h-full min-h-0 flex-col bg-slate-950'>
			{/* Workspace Header */}
			<div className='flex h-12 shrink-0 items-center justify-between border-b border-slate-800 px-4'>
				<h2 className='text-sm font-medium text-slate-300'>Canvas</h2>

				<span className='text-xs text-slate-400'>
					{width} × {height}
				</span>
			</div>

			{/* Canvas Area */}
			<div className='flex min-h-0 flex-1 items-center justify-center overflow-auto p-6'>
				<div
					ref={canvasContainerRef}
					className='relative w-full max-h-full max-w-5xl overflow-hidden border border-slate-600 bg-white shadow-2xl [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full'
					style={{
						aspectRatio: `${width} / ${height}`
					}}
				/>
			</div>

			{/* Workspace Footer */}
			<span className='text-xs text-slate-400'>
				{selectedObject
					? `Selected: ${selectedObject.id} | X: ${Math.round(selectedObject.x)} | Y: ${Math.round(selectedObject.y)}`
					: 'No object selected'}
			</span>
		</div>
	);
}
