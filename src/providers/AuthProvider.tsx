'use client';

import { createContext, useEffect, useState } from 'react';
import { refreshAccessToken } from '../app/api/auth/auth-refresh';
import { setAccessToken, clearAccessToken } from '../app/api/auth/auth-token';
import { getProfile, login, logout, register, verifyEmailOtp } from '../app/api/auth/auth.api';

import type {
	LoginRequest,
	RegisterRequest,
	RegisterResponse,
	VerifyOtpRequest,
	User
} from '../app/api/auth/auth.types';

type AuthContextType = {
	initialized: boolean;
	isAuthenticated: boolean;
	user: User | null;
	signIn: (data: LoginRequest) => Promise<void>;
	signUp: (data: RegisterRequest) => Promise<RegisterResponse>;
	verifyRegistrationOtp: (data: VerifyOtpRequest) => Promise<void>;
	signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
	initialized: false,
	isAuthenticated: false,
	user: null,
	signIn: async () => {
		throw new Error('AuthProvider is not initialized');
	},
	signOut: async () => {
		throw new Error('AuthProvider is not initialized');
	},
	signUp: async () => {
		throw new Error('AuthProvider is not initialized');
	},
	verifyRegistrationOtp: async () => {
		throw new Error('AuthProvider is not initialized');
	}
});

export default function AuthProvider({ children }: { children: React.ReactNode }) {
	const [initialized, setInitialized] = useState(false);

	const [isAuthenticated, setIsAuthenticated] = useState(false);

	const [user, setUser] = useState<User | null>(null);

	const signUp = async (data: RegisterRequest) => {
		const response = await register(data);

		// Registration only sends an OTP. No user session exists until login.
		return response;
	};

	const establishSession = (user: User, accessToken: string) => {
		setAccessToken(accessToken);
		setUser(user);
		setIsAuthenticated(true);
		setInitialized(true);
	};

	const signIn = async (data: LoginRequest) => {
		const response = await login(data);
		establishSession(response.user, response.access_token);
	};

	const verifyRegistrationOtp = async (data: VerifyOtpRequest) => {
		const response = await verifyEmailOtp(data);
		establishSession(response.user, response.access_token);
	};

	const signOut = async () => {
		try {
			await logout();
		} finally {
			clearAccessToken();
			setUser(null);
			setIsAuthenticated(false);
		}
	};

	useEffect(() => {
		const restoreSession = async () => {
			try {
				console.log('Restoring session...');

				const response = await refreshAccessToken();

				console.log('Refresh success');

				setAccessToken(response.access_token);

				const profile = await getProfile();

				console.log('Restored profile:', profile);

				setUser(profile);
				setIsAuthenticated(true);
			} catch (error) {
				console.log('Session restore failed', error);

				clearAccessToken();
				setUser(null);
				setIsAuthenticated(false);
			} finally {
				setInitialized(true);
			}
		};

		restoreSession();
	}, []);

	return (
		<AuthContext.Provider
			value={{
				initialized,
				isAuthenticated,
				user,
				signIn,
				signOut,
				signUp,
				verifyRegistrationOtp
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}
