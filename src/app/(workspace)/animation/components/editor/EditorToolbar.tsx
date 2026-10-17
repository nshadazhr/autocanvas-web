'use client';

type EditorToolbarProps = {
	projectName: string;
	onBack: () => void;
};

export default function EditorToolbar({ projectName, onBack }: EditorToolbarProps) {
	return (
		<div className='flex h-14 items-center justify-between gap-4 px-4'>
			{/* Project Info */}
			<div className='flex min-w-0 items-center gap-3'>
				<button
					type='button'
					onClick={onBack}
					className='rounded-md px-2 py-1 text-sm text-slate-300 hover:bg-slate-800'
				>
					← Back
				</button>

				<span className='truncate text-sm font-semibold text-white'>{projectName}</span>
			</div>

			{/* Editor Tools */}
			<div className='flex items-center gap-2'>
				<button
					type='button'
					disabled
					className='rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white disabled:opacity-50'
				>
					Select
				</button>

				<button
					type='button'
					disabled
					className='rounded-md px-3 py-1.5 text-sm text-slate-300 disabled:opacity-50'
				>
					Move
				</button>

				<button
					type='button'
					disabled
					className='rounded-md px-3 py-1.5 text-sm text-slate-300 disabled:opacity-50'
				>
					Undo
				</button>

				<button
					type='button'
					disabled
					className='rounded-md px-3 py-1.5 text-sm text-slate-300 disabled:opacity-50'
				>
					Redo
				</button>
			</div>

			{/* Actions */}
			<div className='flex items-center gap-2'>
				<button
					type='button'
					disabled
					className='rounded-md border border-slate-600 px-3 py-1.5 text-sm text-white disabled:opacity-50'
				>
					Preview
				</button>

				<button
					type='button'
					disabled
					className='rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50'
				>
					Save
				</button>
			</div>
		</div>
	);
}
