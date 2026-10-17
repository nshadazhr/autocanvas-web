'use client';

import { useContext, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AuthContext } from '../../providers/AuthProvider';
import { Button } from '../ui/button';

export function LogoutButton() {
	const { signOut } = useContext(AuthContext);

	const router = useRouter();

	const [loading, setLoading] = useState(false);

	const handleLogout = async () => {
		if (loading) return;

		setLoading(true);

		try {
			await signOut();

			router.replace('/login');
		} catch (error) {
			console.error('Logout failed:', error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Button
			type='button'
			variant='ghost'
			size='sm'
			onClick={handleLogout}
			disabled={loading}
			className='border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
		>
			{loading ? 'Logging out...' : 'Log out'}
		</Button>
	);
}
