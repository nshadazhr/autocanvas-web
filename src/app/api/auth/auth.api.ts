import axios from 'axios';
import api from '../axios';
import { LoginRequest, LoginResponse, RefreshTokenResponse } from './auth.types';


export const login = async (loginData: LoginRequest): Promise<LoginResponse> => {
	const response = await api.post<LoginResponse>('/auth/login', loginData);

	return response.data;
};

export const refreshAccessToken = async (): Promise<RefreshTokenResponse> => {
	const response = await api.post<RefreshTokenResponse>('/auth/refresh');

	return response.data;
};

// export const register = async (data: RegisterRequest) => {
// 	const response = await api.post('/auth/register', data);
// 	return response.data;
// };

// export const forgotPassword = async (email: string) => {
// 	const response = await api.post('/auth/forgot-password', {
// 		email
// 	});

// 	return response.data;
// };

// export const resetPassword = async (token: string, password: string) => {
// 	const response = await api.post('/auth/reset-password', {
// 		token,
// 		password
// 	});

// 	return response.data;
// };
