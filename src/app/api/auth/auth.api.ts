import api from '../axios';

import {
	LoginRequest,
	LoginResponse,
	RegisterRequest,
	RegisterResponse,
	ResendOtpRequest,
	ResendOtpResponse,
	VerifyOtpRequest,
	VerifyOtpResponse
} from './auth.types';

export const register = async (data: RegisterRequest): Promise<RegisterResponse> => {
	const response = await api.post<RegisterResponse>('/auth/register', data);
	return response.data;
};

export const resendEmailOtp = async (data: ResendOtpRequest): Promise<ResendOtpResponse> => {
	const response = await api.post<ResendOtpResponse>('/auth/resend-otp', data);

	return response.data;
};
export const login = async (loginData: LoginRequest): Promise<LoginResponse> => {
	const response = await api.post<LoginResponse>('/auth/login', loginData);

	return response.data;
};

export const logout = async (): Promise<LoginResponse> => {
	const response = await api.post<LoginResponse>('/auth/logout');

	return response.data;
};

export const getProfile = async (): Promise<any> => {
	const response = await api.get<any>('/auth/profile');

	return response.data;
};

export const verifyEmailOtp = async (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
	const response = await api.post<VerifyOtpResponse>('/auth/verify-email-otp', data);
	return response.data;
};
