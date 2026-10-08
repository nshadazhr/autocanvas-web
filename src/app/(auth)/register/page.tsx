'use client';

import { useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Button } from '@/src/components/ui/button';
import { AuthContext } from '@/src/providers/AuthProvider';

const STATS = [
	{
		emoji: '⚡',
		title: 'Easy to Use',
		subtitle: 'No technical skills'
	},
	{
		emoji: '👥',
		title: '1500+ Creators',
		subtitle: 'Worldwide'
	},
	{
		emoji: '▶️',
		title: 'Create Faster',
		subtitle: 'With AI'
	},
	{
		emoji: '📈',
		title: 'Grow Your Channel',
		subtitle: 'Faster'
	}
];

const STICKY_NOTES = [
	{
		text: 'Big Ideas',
		className: 'left-4 top-6 -rotate-6 bg-amber-300'
	},
	{
		text: 'Better Stories',
		className: 'right-6 top-14 rotate-3 bg-sky-300'
	},
	{
		text: 'Bigger Audience',
		className: 'left-10 bottom-8 rotate-2 bg-pink-300'
	}
];

export default function RegisterPage() {
	const router = useRouter();
	const { signUp } = useContext(AuthContext);

	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (submitting) return;

		setSubmitting(true);
		setError(null);

		try {
			await signUp({
				name: name.trim(),
				email: email.trim(),
				password
			});

			router.replace('/dashboard');
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const message = error.response?.data?.message;

				setError(
					Array.isArray(message)
						? message.join(', ')
						: typeof message === 'string'
							? message
							: 'Could not create your account.'
				);
			} else {
				setError('Something went wrong. Please try again.');
			}
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<main className='flex min-h-screen bg-[#05050c] text-white'>
			{/* LEFT PANEL */}

			<section className='relative hidden w-1/2 flex-col justify-between overflow-hidden p-10 lg:flex'>
				<div className='pointer-events-none absolute inset-0'>
					<div className='absolute -left-24 top-0 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl' />
					<div className='absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl' />
				</div>

				<Link href='/' className='relative z-10 flex items-center gap-2.5'>
					<span className='flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-lg font-bold'>
						A
					</span>

					<span className='flex flex-col leading-none'>
						<span className='text-lg font-bold tracking-tight'>
							Auto
							<span className='text-indigo-400'>Canvas</span>
						</span>

						<span className='text-[11px] text-slate-400'>Create. Animate. Share.</span>
					</span>
				</Link>

				<div className='relative z-10 my-8 flex-1 rounded-3xl border border-white/10 bg-white/[0.03] p-6'>
					<div className='relative flex h-full items-center justify-center'>
						<span className='text-8xl'>🧑‍💻</span>

						{STICKY_NOTES.map(note => (
							<span
								key={note.text}
								className={`absolute rounded-md px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-lg ${note.className}`}
							>
								{note.text}
							</span>
						))}
					</div>
				</div>

				<div className='relative z-10 flex flex-col gap-4'>
					<h2 className='text-3xl font-extrabold leading-tight tracking-tight'>
						Turn Your Ideas Into{' '}
						<span className='bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent'>
							Amazing Stories
						</span>
					</h2>

					<p className='max-w-md text-sm text-slate-400'>
						All-in-one AI platform to create cartoon stories, generate characters, backgrounds, voices, thumbnails and
						videos.
					</p>

					<div className='grid grid-cols-2 gap-4 pt-2'>
						{STATS.map(stat => (
							<div key={stat.title} className='flex items-center gap-2.5'>
								<span className='text-xl'>{stat.emoji}</span>

								<div className='flex flex-col leading-tight'>
									<span className='text-sm font-semibold text-white'>{stat.title}</span>

									<span className='text-xs text-slate-500'>{stat.subtitle}</span>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* RIGHT PANEL */}

			<section className='flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2'>
				<div className='w-full max-w-sm'>
					{/* Mobile Logo */}

					<Link href='/' className='mb-8 flex items-center gap-2.5 lg:hidden'>
						<span className='flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-lg font-bold'>
							A
						</span>

						<span className='text-lg font-bold'>
							Auto
							<span className='text-indigo-400'>Canvas</span>
						</span>
					</Link>

					<h1 className='text-3xl font-extrabold tracking-tight'>Create Your Account</h1>

					<p className='mt-2 text-sm text-slate-400'>Join AutoCanvas and start creating amazing content.</p>

					<form onSubmit={handleSubmit} className='mt-8 flex flex-col gap-4'>
						{/* NAME */}

						<div>
							<label htmlFor='register-name' className='text-xs font-semibold uppercase tracking-wide text-slate-400'>
								Full Name
							</label>

							<input
								id='register-name'
								type='text'
								placeholder='Enter your full name'
								value={name}
								onChange={e => setName(e.target.value)}
								required
								autoComplete='name'
								className='mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none'
							/>
						</div>

						{/* EMAIL */}

						<div>
							<label htmlFor='register-email' className='text-xs font-semibold uppercase tracking-wide text-slate-400'>
								Email Address
							</label>

							<input
								id='register-email'
								type='email'
								placeholder='you@example.com'
								value={email}
								onChange={e => setEmail(e.target.value)}
								required
								autoComplete='email'
								className='mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none'
							/>
						</div>

						{/* PASSWORD */}

						<div>
							<label
								htmlFor='register-password'
								className='text-xs font-semibold uppercase tracking-wide text-slate-400'
							>
								Password
							</label>

							<input
								id='register-password'
								type='password'
								placeholder='At least 8 characters'
								value={password}
								onChange={e => setPassword(e.target.value)}
								required
								minLength={8}
								autoComplete='new-password'
								className='mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none'
							/>

							<p className='mt-2 text-xs text-slate-500'>Use at least 8 characters.</p>
						</div>

						{/* ERROR */}

						{error && (
							<p
								role='alert'
								className='rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400'
							>
								{error}
							</p>
						)}

						{/* SUBMIT */}

						<Button type='submit' variant='gradient' disabled={submitting} className='mt-2 w-full py-3'>
							{submitting ? 'Creating account...' : 'Create Account →'}
						</Button>
					</form>

					<p className='mt-6 text-center text-sm text-slate-400'>
						Already have an account?{' '}
						<Link href='/login' className='font-medium text-indigo-300 hover:text-indigo-200'>
							Log in
						</Link>
					</p>

					<p className='mt-8 text-center text-xs leading-relaxed text-slate-500'>
						By creating an account, you agree to our{' '}
						<Link href='/terms' className='text-slate-300 underline underline-offset-2'>
							Terms of Service
						</Link>{' '}
						and{' '}
						<Link href='/privacy' className='text-slate-300 underline underline-offset-2'>
							Privacy Policy
						</Link>
						.
					</p>
				</div>
			</section>
		</main>
	);
}
