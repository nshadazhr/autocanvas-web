import Link from 'next/link';
import {
	getCreditAccount,
	getCurrentPlanKey,
	DUMMY_PLANS,
	listAudioProjects,
	getAudioProjectDetail
} from '../../../lib/dummy-data';

// Quick Start navigation
const QUICK_START = [
	{
		href: '/audio',
		icon: '🎵',
		label: 'Create Audio',
		sub: 'Narrate a script'
	},
	{
		href: '/script',
		icon: '📝',
		label: 'Generate Script',
		sub: 'Story from an idea'
	},
	{
		href: '/images',
		icon: '🖼️',
		label: 'Create Images',
		sub: 'Characters & scenes'
	},
	{
		href: '/thumbnails',
		icon: '🖼',
		label: 'Create Thumbnails',
		sub: 'Eye-catching covers'
	},
	{
		href: '/videos',
		icon: '▶️',
		label: 'Create Videos',
		sub: 'Full video cuts'
	},
	{
		href: '/templates',
		icon: '🧩',
		label: 'Browse Templates',
		sub: 'Jump-start a project'
	}
];

// Illustrative preview projects
const FILLER_PROJECTS = [
	{
		name: 'Village Story Script',
		type: 'Script',
		icon: '📝',
		status: 'Completed',
		when: '2 hours ago',
		href: '/script'
	},
	{
		name: 'Character Concept Art',
		type: 'Image',
		icon: '🖼️',
		status: 'Completed',
		when: '5 hours ago',
		href: '/images'
	},
	{
		name: 'Episode 1 Thumbnail',
		type: 'Thumbnail',
		icon: '🖼',
		status: 'Completed',
		when: '1 day ago',
		href: '/thumbnails'
	},
	{
		name: 'Teaser Trailer Cut',
		type: 'Video',
		icon: '▶️',
		status: 'Draft',
		when: '2 days ago',
		href: '/videos'
	}
];

function StatusBadge({ status }: { status: string }) {
	const styles: Record<string, string> = {
		Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
		'In Progress': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
		Draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
	};

	return (
		<span
			className={`inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-medium sm:px-2.5 sm:text-xs ${
				styles[status] ?? styles.Draft
			}`}
		>
			{status}
		</span>
	);
}

export default async function DashboardPage() {
	const creditAccount = getCreditAccount();
	const planKey = getCurrentPlanKey();
	const plan = DUMMY_PLANS.find(p => p.key === planKey);

	const monthlyCredits = plan?.monthlyCredits ?? creditAccount.balance;

	const creditsUsed = Math.max(0, monthlyCredits - creditAccount.balance);

	const percentUsed = monthlyCredits > 0 ? Math.min(100, Math.round((creditsUsed / monthlyCredits) * 100)) : 0;

	const audioProjects = listAudioProjects();
	const firstAudioProject = audioProjects[0] ?? null;

	const audioDetail = firstAudioProject?.audioProject
		? getAudioProjectDetail(firstAudioProject.audioProject.id)
		: null;

	const completedScenes = audioDetail ? audioDetail.scenes.filter(s => s.status === 'COMPLETED').length : 0;

	const totalScenes = audioDetail ? audioDetail.scenes.length : 0;

	const audioStatusLabel =
		totalScenes === 0 ? 'Draft' : completedScenes === totalScenes ? 'Completed' : 'In Progress';

	const ringStyle = {
		background: `conic-gradient(#818cf8 ${percentUsed * 3.6}deg, rgba(255,255,255,0.08) 0deg)`
	};

	return (
		<div className='flex min-w-0 flex-col gap-6 xl:flex-row xl:gap-8'>
			{/* Main content */}
			<div className='flex min-w-0 flex-1 flex-col gap-6 sm:gap-8'>
				{/* Hero Banner */}
				<section className='relative min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600/20 via-indigo-500/10 to-transparent px-5 py-6 sm:px-8 sm:py-10'>
					<div className='relative z-10'>
						<p className='text-[10px] font-semibold uppercase tracking-wide text-indigo-300 sm:text-xs'>
							AI Powered Creative Platform
						</p>

						<h1 className='mt-2 max-w-lg text-2xl font-bold leading-tight text-white sm:text-4xl'>
							Turn Your Ideas Into{' '}
							<span className='bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent'>
								Amazing Content
							</span>
						</h1>

						{/* Description hidden on mobile */}
						<p className='mt-3 hidden max-w-md text-sm leading-relaxed text-slate-400 sm:block'>
							Welcome back, usernamedummy. Pick up where you left off or start something new.
						</p>

						<div className='mt-5 flex flex-wrap items-center gap-3 sm:mt-6'>
							<Link
								href='/audio'
								className='inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-opacity hover:opacity-90'
							>
								+ Create New Project
							</Link>

							{/* Disabled demo hidden on mobile */}
							<span
								className='hidden cursor-not-allowed rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-400 sm:inline-flex'
								title='Demo only — no walkthrough video in this preview'
							>
								▶ Watch Demo
							</span>
						</div>
					</div>

					<span className='pointer-events-none absolute -right-6 -top-6 text-[120px] opacity-10 sm:text-[160px]'>
						🎨
					</span>
				</section>

				{/* Quick Start */}
				<section className='min-w-0'>
					<h2 className='mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400'>Quick Start</h2>

					<div className='grid grid-cols-2 gap-3 md:grid-cols-3'>
						{QUICK_START.map(item => (
							<Link
								key={item.href}
								href={item.href}
								className='flex min-w-0 flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06] sm:p-4'
							>
								<span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-lg'>
									{item.icon}
								</span>

								<span className='break-words text-sm font-medium text-white'>{item.label}</span>

								<span className='break-words text-xs leading-relaxed text-slate-500'>{item.sub}</span>
							</Link>
						))}
					</div>
				</section>

				{/* Recent Projects */}
				<section className='min-w-0'>
					<div className='mb-3 flex items-center justify-between gap-3'>
						<h2 className='text-sm font-semibold uppercase tracking-wide text-slate-400'>
							Recent Projects
						</h2>

						<Link
							href='/audio'
							className='shrink-0 text-xs font-medium text-indigo-400 hover:text-indigo-300'
						>
							View all →
						</Link>
					</div>

					<div className='max-w-full overflow-x-auto rounded-xl border border-white/10'>
						<table className='w-full table-fixed text-left text-sm sm:min-w-[620px] sm:table-auto'>
							<thead className='bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500'>
								<tr>
									<th className='w-[62%] px-3 py-3 font-medium sm:w-auto sm:px-4'>Project</th>

									<th className='hidden px-4 py-3 font-medium sm:table-cell'>Type</th>

									<th className='w-[38%] px-2 py-3 font-medium sm:w-auto sm:px-4'>Status</th>

									<th className='hidden px-4 py-3 font-medium sm:table-cell'>Updated</th>
								</tr>
							</thead>

							<tbody className='divide-y divide-white/5'>
								{firstAudioProject && (
									<tr className='transition-colors hover:bg-white/[0.02]'>
										<td className='min-w-0 px-3 py-3 sm:px-4'>
											<Link
												href={`/audio/${firstAudioProject.audioProject?.id}`}
												className='block break-words font-medium text-white hover:text-indigo-300'
											>
												{firstAudioProject.name}
											</Link>
										</td>

										<td className='hidden px-4 py-3 text-slate-400 sm:table-cell'>🎵 Audio</td>

										<td className='px-2 py-3 sm:px-4'>
											<StatusBadge status={audioStatusLabel} />
										</td>

										<td className='hidden px-4 py-3 text-slate-500 sm:table-cell'>Just now</td>
									</tr>
								)}

								{FILLER_PROJECTS.map(p => (
									<tr key={p.name} className='transition-colors hover:bg-white/[0.02]'>
										<td className='min-w-0 px-3 py-3 sm:px-4'>
											<Link
												href={p.href}
												className='block break-words font-medium text-white hover:text-indigo-300'
											>
												{p.name}
											</Link>
										</td>

										<td className='hidden px-4 py-3 text-slate-400 sm:table-cell'>
											{p.icon} {p.type}
										</td>

										<td className='px-2 py-3 sm:px-4'>
											<StatusBadge status={p.status} />
										</td>

										<td className='hidden px-4 py-3 text-slate-500 sm:table-cell'>{p.when}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<p className='mt-2 text-xs leading-relaxed text-slate-500'>
						Only &ldquo;{firstAudioProject?.name}&rdquo; is a real project in this preview — the other rows
						above are illustrative, since Script/Image/Thumbnail/Video Studio aren&apos;t built yet.
					</p>
				</section>
			</div>

			{/* Usage and account information */}
			<div className='flex w-full min-w-0 flex-col gap-5 xl:w-80 xl:shrink-0'>
				{/* Usage Overview */}
				<section className='min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6'>
					<h3 className='text-sm font-semibold text-white'>Usage Overview</h3>

					<div className='mt-4 flex items-center justify-center sm:mt-4'>
						<div
							className='relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full sm:h-32 sm:w-32'
							style={ringStyle}
						>
							<div className='flex h-20 w-20 flex-col items-center justify-center rounded-full bg-[#0a0a14] sm:h-24 sm:w-24'>
								<span className='text-lg font-bold text-white sm:text-xl'>{percentUsed}%</span>

								<span className='text-[10px] text-slate-500'>used</span>
							</div>
						</div>
					</div>

					<p className='mt-3 break-words text-center text-xs text-slate-400 sm:mt-4 sm:text-sm'>
						{creditsUsed.toLocaleString()} / {monthlyCredits.toLocaleString()} credits this month
					</p>

					<div className='mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-center sm:mt-5'>
						<div className='min-w-0'>
							<p className='text-lg font-semibold text-white'>{audioProjects.length}</p>

							<p className='text-xs text-slate-500'>Projects</p>
						</div>

						<div className='min-w-0'>
							<p className='text-lg font-semibold text-white'>{completedScenes}</p>

							<p className='text-xs text-slate-500'>Audio files</p>
						</div>
					</div>
				</section>

				{/* Upgrade card hidden on mobile */}
				<section className='hidden min-w-0 rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/10 to-transparent p-6 sm:block'>
					<span className='text-2xl'>✨</span>

					<h3 className='mt-2 text-sm font-semibold text-white'>
						{plan?.key === 'business' ? "You're on Business" : 'Upgrade to Pro'}
					</h3>

					<p className='mt-1 text-xs leading-relaxed text-slate-400'>
						{plan?.key === 'business'
							? 'You already have the highest monthly credit allotment available.'
							: 'Get more monthly credits and unlock higher-priority generation.'}
					</p>

					<Link
						href='/billing'
						className='mt-4 inline-flex rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-opacity hover:opacity-90'
					>
						Manage billing →
					</Link>
				</section>

				{/* Help card hidden on mobile */}
				<section className='hidden min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:block'>
					<span className='text-2xl'>💬</span>

					<h3 className='mt-2 text-sm font-semibold text-white'>Need Help?</h3>

					<p className='mt-1 text-xs leading-relaxed text-slate-400'>
						This is a preview build — support isn&apos;t connected yet, but Audio Studio is fully working
						end to end.
					</p>
				</section>
			</div>
		</div>
	);
}
