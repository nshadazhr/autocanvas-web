import axios from 'axios';
import { clearAccessToken, getAccessToken, setAccessToken } from './auth/auth-token';
import { refreshAccessToken } from './auth/auth-refresh';

const axiosConfig = {
	baseURL: process.env.NEXT_PUBLIC_API_URL,
	headers: {
		'Content-Type': 'application/json'
	},
	withCredentials: true
};

// Normal APIs
const api = axios.create(axiosConfig);

// REQUEST INTERCEPTOR
api.interceptors.request.use(
	config => {
		const token = getAccessToken();

		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		return config;
	},
	error => {
		return Promise.reject(error);
	}
);

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
	response => {
		return response;
	},

	async error => {
		const originalRequest = error.config;

		// Login/Register/Refresh ke 401 par
		// refresh token call nahi karna
		const isAuthRequest =
			originalRequest?.url?.includes('/auth/login') ||
			originalRequest?.url?.includes('/auth/register') ||
			originalRequest?.url?.includes('/auth/refresh');

		if (error.response?.status === 401 && !originalRequest?._retry && !isAuthRequest) {
			originalRequest._retry = true;

			try {
				const response = await refreshAccessToken();

				const newAccessToken = response.access_token;

				setAccessToken(newAccessToken);

				originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

				return api(originalRequest);
			} catch (refreshError) {
				clearAccessToken();

				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	}
);

export default api;
