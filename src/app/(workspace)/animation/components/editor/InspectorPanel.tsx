'use client';

import type { SelectedObject } from '../../types';

type InspectorPanelProps = {
	selectedObject: SelectedObject | null;
	onUpdateObject: (updates: Partial<SelectedObject>) => void;
	onDeleteObject: () => void;
};

export default function InspectorPanel({ selectedObject, onUpdateObject, onDeleteObject }: InspectorPanelProps) {
	return (
		<div className='flex h-full flex-col bg-slate-900'>
			{/* Header */}
			<div className='border-b border-slate-700 p-4'>
				<h2 className='text-sm font-semibold text-white'>Inspector</h2>

				<p className='mt-1 text-xs text-slate-400'>Object properties</p>
			</div>

			{/* Properties Content */}
			<div className='flex flex-1 flex-col items-center justify-center p-4 text-center'>
				<p className='text-sm text-slate-400'>No object selected</p>

				<p className='mt-2 text-xs text-slate-500'>Select an object on the canvas to edit its properties.</p>
			</div>

			<button
				type='button'
				onClick={onDeleteObject}
				disabled={!selectedObject || selectedObject.id === 'rectangle-1'}
				className='mt-4 w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40'
			>
				Delete Rectangle
			</button>

			<div className='space-y-4 p-4'>
				{!selectedObject ? (
					<p className='text-sm text-slate-400'>No object selected</p>
				) : (
					<>
						<h3 className='text-sm font-semibold text-white'>Object Properties</h3>

						<div className='space-y-3'>
							{(
								[
									['X', selectedObject.x],
									['Y', selectedObject.y],
									['Width', selectedObject.width],
									['Height', selectedObject.height]
								] as const
							).map(([label, value]) => (
								<div key={label} className='flex items-center justify-between gap-3'>
									<span className='text-xs text-slate-400'>{label}</span>

									<input
										type='number'
										min={label === 'Width' || label === 'Height' ? 1 : undefined}
										value={value}
										onChange={event => {
											const newValue = Number(event.target.value);

											if (!Number.isFinite(newValue)) return;

											if ((label === 'Width' || label === 'Height') && newValue <= 0) {
												return;
											}

											onUpdateObject({
												[label.toLowerCase()]: newValue
											});
										}}
										className='w-24 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-right text-sm text-white outline-none focus:border-indigo-500'
									/>
								</div>
							))}
						</div>
					</>
				)}
			</div>
		</div>
	);
}
