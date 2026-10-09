'use client';

import { useMemo } from 'react';
import { getAppSettings } from '../lib/appResolvers';

export function useAppSettings() {
	const appSettings = useMemo(() => getAppSettings(), []);

	return { appSettings };
}
