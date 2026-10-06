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
