export interface RegisterRequest {
	name: string;
	email: string;
	password: string;
}
export interface RegisterResponse {
	id: number;
	email: string;
	name: string;
	created_at: string;
	updated_at: string;
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
