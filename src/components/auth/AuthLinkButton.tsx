'use client';

import { useContext } from 'react';
import { AuthContext } from '../../providers/AuthProvider';
import { LinkButton } from '../ui/button';

export const AuthLinkButton = () => {
	const { initialized, isAuthenticated } = useContext(AuthContext);

	if (!initialized) {
		return <div className='h-9 w-28 animate-pulse rounded-full bg-white/10' />;
	}

	return (
		<LinkButton href={isAuthenticated ? '/dashboard' : '/login'} variant={isAuthenticated ? 'gradient' : 'outlineDark'}>
			{isAuthenticated ? 'My Projects' : 'Sign Up'}
		</LinkButton>
	);
};
