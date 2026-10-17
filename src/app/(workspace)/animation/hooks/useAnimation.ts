'use client';

import { AnimationContext } from '@/src/providers/AnimationProvider';
import { useContext } from 'react';
// import { AnimationContext } from '@/providers/AnimationProvider';

export function useAnimation() {
	const context = useContext(AnimationContext);

	if (!context) {
		throw new Error('useAnimation must be used within AnimationProvider');
	}

	return context;
}
