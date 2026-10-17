'use client';

import { useState } from 'react';

type AssetTab = 'characters' | 'images' | 'audio' | 'backgrounds';

const assetTabs: { id: AssetTab; label: string }[] = [
	{ id: 'characters', label: 'Characters' },
	{ id: 'images', label: 'Images' },
	{ id: 'audio', label: 'Audio' },
	{ id: 'backgrounds', label: 'Backgrounds' }
];

type AssetsPanelProps = {
	onAddRectangle: () => void;
};

export default function AssetsPanel({ onAddRectangle }: AssetsPanelProps) {
	const [activeTab, setActiveTab] = useState<AssetTab>('characters');

	return (
		<div className='flex h-full flex-col'>
			{/* Header */}
			<div className='border-b border-slate-700 p-4'>
				<h2 className='text-sm font-semibold text-white'>Assets Library</h2>

				<p className='mt-1 text-xs text-slate-400'>Manage your animation assets</p>
			</div>

			{/* Asset Categories */}
			<div className='flex flex-wrap gap-2 border-b border-slate-700 p-3'>
				{assetTabs.map(tab => (
					<button
						key={tab.id}
						type='button'
						onClick={() => setActiveTab(tab.id)}
						className={`rounded-md px-3 py-2 text-xs transition-colors ${
							activeTab === tab.id
								? 'bg-indigo-600 text-white'
								: 'bg-slate-800 text-slate-300 hover:bg-slate-700'
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			<button
				type='button'
				onClick={onAddRectangle}
				className='w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500'
			>
				+ Add Rectangle
			</button>
			{/* Assets Content */}
			<div className='flex flex-1 flex-col items-center justify-center p-4 text-center'>
				<p className='text-sm text-slate-400'>No {activeTab} available yet.</p>

				<p className='mt-2 text-xs text-slate-500'>Your assets will appear here.</p>
			</div>

			{/* Add Asset */}
			<div className='border-t border-slate-700 p-3'>
				<button
					type='button'
					disabled
					className='w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50'
				>
					+ Add Asset
				</button>
			</div>
		</div>
	);
}
