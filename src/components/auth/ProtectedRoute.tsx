'use client';

import { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/src/providers/AuthProvider';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const { initialized, isAuthenticated } = useContext(AuthContext);

	useEffect(() => {
		if (initialized && !isAuthenticated) {
			router.replace('/');
		}
	}, [initialized, isAuthenticated, router]);

	if (!initialized) {
		return <div>Checking session...</div>;
	}

	if (!isAuthenticated) {
		return null;
	}

	return <>{children}</>;
}
