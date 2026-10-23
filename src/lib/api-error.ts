import { isAxiosError } from 'axios';

export function apiErrorMessage(error: unknown, fallback: string) {
	if (!isAxiosError(error)) return fallback;
	const message = error.response?.data?.message;
	if (typeof message === 'string' && message.trim()) return message;
	if (Array.isArray(message)) return message.filter(value => typeof value === 'string').join(' ');
	return fallback;
}
