'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import type { SelectedObject } from '../../types';

type AnimationEditorLayoutProps = {
	toolbar: ReactNode;
	assetsPanel: ReactNode;
	canvas: ReactNode;
	inspector: ReactNode;
	timeline: ReactNode;
};

export default function AnimationEditorLayout({
	toolbar,
	assetsPanel,
	canvas,
	inspector,
	timeline
}: AnimationEditorLayoutProps) {
	const [selectedObject, setSelectedObject] = useState<SelectedObject | null>(null);
	return (
		<div className='flex h-full min-h-0 flex-col overflow-hidden bg-slate-950 text-white'>
			{/* Top Toolbar */}
			<header className='shrink-0 border-b border-slate-700 bg-slate-900'>{toolbar}</header>

			{/* Main Workspace */}
			<div className='flex min-h-0 flex-1'>
				{/* Left Assets Panel */}
				<aside className='w-64 shrink-0 overflow-y-auto border-r border-slate-700 bg-slate-900'>
					{assetsPanel}
				</aside>

				{/* Center Canvas */}
				<section className='min-w-0 flex-1 overflow-hidden bg-slate-950'>{canvas}</section>

				{/* Right Inspector */}
				<aside className='w-72 shrink-0 overflow-y-auto border-l border-slate-700 bg-slate-900'>
					{inspector}
				</aside>
			</div>

			{/* Bottom Timeline */}
			<section className='h-56 shrink-0 overflow-hidden border-t border-slate-700 bg-slate-900'>
				{timeline}
			</section>
		</div>
	);
}
