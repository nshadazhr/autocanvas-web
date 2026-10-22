import type { ReactNode } from 'react';

import { getCreditAccount, getCurrentPlanKey, DUMMY_PLANS } from '../../lib/dummy-data';

import { AppShell } from '../../components/layout/AppShell';
import ProtectedRoute from '../../components/auth/ProtectedRoute';

export default async function AppLayout({ children }: { children: ReactNode }) {
	const creditAccount = getCreditAccount();

	const planKey = getCurrentPlanKey();

	const plan = DUMMY_PLANS.find(p => p.key === planKey);

	const planLabel = plan ? `${plan.name} Plan` : 'Free Plan';

	return (
		<ProtectedRoute>
			<AppShell planLabel={planLabel} creditBalance={creditAccount.balance}>
				{children}
			</AppShell>
		</ProtectedRoute>
	);
}
