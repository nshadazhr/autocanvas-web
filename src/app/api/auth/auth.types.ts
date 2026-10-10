export interface RegisterRequest {
	name: string;
	email: string;
	password: string;
}
export interface RegisterResponse {
	success: boolean;
	message: string;
	email: string;
	emailId?: string;
	expiresIn: number;
}

export interface VerifyOtpRequest {
	email: string;
	otp: string;
}

export interface VerifyOtpResponse {
	success: boolean;
	message: string;
	user: User;
	access_token: string;
}
export interface LoginRequest {
	email: string;
	password: string;
}

export interface User {
	id: number;
	name: string;
	email: string;
}

export interface LoginResponse {
	user: User;
	access_token: string;
}

export interface RefreshTokenResponse {
	access_token: string;
}

export interface ResendOtpRequest {
	email: string;
}

export interface ResendOtpResponse {
	success: boolean;
	message: string;
	email: string;
	expiresIn: number;
}
