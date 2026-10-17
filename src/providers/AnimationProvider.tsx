'use client';

import { createContext, useState, type ReactNode } from 'react';

type AnimationContextType = {
	activeProjectId: number | null;
	setActiveProjectId: (id: number | null) => void;
};

export const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export default function AnimationProvider({ children }: { children: ReactNode }) {
	const [activeProjectId, setActiveProjectId] = useState<number | null>(null);

	return (
		<AnimationContext.Provider
			value={{
				activeProjectId,
				setActiveProjectId
			}}
		>
			{children}
		</AnimationContext.Provider>
	);
}
