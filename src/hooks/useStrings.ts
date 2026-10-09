'use client';

import { useMemo } from 'react';
import { getStrings } from '../lib/appResolvers/appStringsResolver';

/**
 * Access any global string without specifying a namespace.
 */
export function useStrings() {
	const lsv = useMemo(() => getStrings(), []);

	return { lsv };
}
