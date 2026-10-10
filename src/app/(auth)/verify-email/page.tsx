'use client';

import { FormEvent, Suspense, useContext, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { verifyEmailOtp, resendEmailOtp } from '@/src/app/api/auth/auth.api';
import { Button } from '@/src/components/ui/button';
import { AuthContext } from '@/src/providers/AuthProvider';

function VerifyEmailForm() {
	const { verifyRegistrationOtp } = useContext(AuthContext);
	const router = useRouter();
	const params = useSearchParams();
	const data = params.get('data');

	const registrationResponse = data ? JSON.parse(data) : null;
	const [otp, setOtp] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Resend OTP
	const [resending, setResending] = useState(false);
	const [resendSeconds, setResendSeconds] = useState(60);
	const [resendMessage, setResendMessage] = useState<string | null>(null);

	useEffect(() => {
		if (resendSeconds <= 0) return;

		const timer = setTimeout(() => {
			setResendSeconds(seconds => Math.max(0, seconds - 1));
		}, 1000);

		return () => clearTimeout(timer);
	}, [resendSeconds]);

	async function handleResendOtp() {
		if (resending || submitting || resendSeconds > 0 || !registrationResponse?.email) return;

		setResending(true);
		setError(null);
		setResendMessage(null);

		try {
			const response = await resendEmailOtp({
				email: registrationResponse.email
			});

			setOtp('');
			setResendSeconds(60);
			setResendMessage(response.message);
		} catch (err) {
			if (axios.isAxiosError(err)) {
				const message = err.response?.data?.message;
				setError(
					Array.isArray(message) ? message.join(', ') : typeof message === 'string' ? message : 'Failed to resend OTP.'
				);
			} else {
				setError('Something went wrong. Please try again.');
			}
		} finally {
			setResending(false);
		}
	}

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (submitting || !registrationResponse?.email || !/^\d{6}$/.test(otp)) return;
		setSubmitting(true);
		setError(null);

		try {
			await verifyRegistrationOtp({
				email: registrationResponse.email,
				otp
			});

			router.replace('/dashboard');
			router.replace('/dashboard');
		} catch (err) {
			if (axios.isAxiosError(err)) {
				const message = err.response?.data?.message;
				setError(
					Array.isArray(message)
						? message.join(', ')
						: typeof message === 'string'
							? message
							: 'OTP verification failed.'
				);
			} else {
				setError('Something went wrong. Please try again.');
			}
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<main className='flex min-h-screen items-center justify-center bg-[#05050c] px-6 text-white'>
			<section className='w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8'>
				<Link href='/' className='text-xl font-bold'>
					Auto<span className='text-indigo-400'>Canvas</span>
				</Link>
				<h1 className='mt-8 text-3xl font-extrabold'>Verify Your Email</h1>
				<p className='mt-3 text-sm text-slate-400'>
					Enter the 6-digit code sent to{' '}
					<span className='text-white'>{registrationResponse?.email || 'your email'}</span>. It expires in{' '}
					{registrationResponse?.expiresIn / 60} minutes.
				</p>

				<form onSubmit={handleSubmit} className='mt-8 flex flex-col gap-4'>
					<label htmlFor='verification-otp' className='text-xs font-semibold uppercase tracking-wide text-slate-400'>
						Verification Code
					</label>
					<input
						id='verification-otp'
						type='text'
						inputMode='numeric'
						autoComplete='one-time-code'
						maxLength={6}
						required
						pattern='[0-9]{6}'
						value={otp}
						onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
						placeholder='000000'
						className='w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-2xl tracking-[0.4em] text-white focus:border-indigo-400 focus:outline-none'
					/>
					{error && (
						<p
							role='alert'
							className='rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400'
						>
							{error}
						</p>
					)}
					<Button
						type='submit'
						variant='gradient'
						disabled={submitting || resending || !registrationResponse?.email || otp.length !== 6}
						className='w-full py-3'
					>
						{submitting ? 'Verifying...' : 'Verify Email'}
					</Button>
				</form>

				{/* Resend OTP */}
				<div className='mt-6 text-center text-sm'>
					<p className='text-slate-400'>Didn't receive the code?</p>
					<button
						type='button'
						onClick={handleResendOtp}
						disabled={resending || submitting || resendSeconds > 0 || !registrationResponse?.email}
						className='mt-2 font-semibold text-indigo-300 hover:text-indigo-200 disabled:cursor-not-allowed disabled:opacity-50'
					>
						{resending ? 'Sending...' : resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Resend OTP'}
					</button>
					{resendMessage && (
						<p role='status' className='mt-3 text-green-400'>
							{resendMessage}
						</p>
					)}
				</div>

				<p className='mt-6 text-center text-sm text-slate-400'>
					Need another code?{' '}
					<Link href='/register' className='text-indigo-300 hover:text-indigo-200'>
						Return to registration
					</Link>
				</p>
			</section>
		</main>
	);
}

export default function VerifyEmailPage() {
	return (
		<Suspense fallback={<main className='min-h-screen bg-[#05050c]' />}>
			<VerifyEmailForm />
		</Suspense>
	);
}
