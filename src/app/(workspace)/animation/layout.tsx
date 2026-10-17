import AnimationProvider from '@/src/providers/AnimationProvider';
import type { ReactNode } from 'react';

export default function AnimationLayout({ children }: { children: ReactNode }) {
	return <AnimationProvider>{children}</AnimationProvider>;
}
