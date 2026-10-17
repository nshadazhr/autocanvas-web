import axios from 'axios';
import type { RefreshTokenResponse } from './auth.types';

let refreshPromise: Promise<RefreshTokenResponse> | null = null;

export const refreshAccessToken = (): Promise<RefreshTokenResponse> => {
	if (!refreshPromise) {
		refreshPromise = axios
			.post<RefreshTokenResponse>(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {}, { withCredentials: true })
			.then(response => response.data)
			.finally(() => {
				refreshPromise = null;
			});
	}

	return refreshPromise;
};
