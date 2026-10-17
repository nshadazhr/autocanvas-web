import type { ReactNode } from 'react';
import ProtectedRoute from '../../components/auth/ProtectedRoute';

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
	return (
		<ProtectedRoute>
			<div className='flex h-dvh w-full flex-col overflow-hidden bg-[#05050c]'>{children}</div>
		</ProtectedRoute>
	);
}
