'use client';

import { createContext, useEffect, useState } from 'react';
import { refreshAccessToken } from '../app/api/auth/auth-refresh';
import { setAccessToken, clearAccessToken } from '../app/api/auth/auth-token';
import { getProfile, login, logout, register } from '../app/api/auth/auth.api';
import type { LoginRequest, RegisterRequest, User } from '../app/api/auth/auth.types';

type AuthContextType = {
	initialized: boolean;
	isAuthenticated: boolean;
	user: User | null;
	signIn: (data: LoginRequest) => Promise<void>;
	signUp: (data: RegisterRequest) => Promise<void>;
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
	}
});

export default function AuthProvider({ children }: { children: React.ReactNode }) {
	const [initialized, setInitialized] = useState(false);

	const [isAuthenticated, setIsAuthenticated] = useState(false);

	const [user, setUser] = useState<User | null>(null);

	const signUp = async (data: RegisterRequest) => {
		const response = await register(data);

		setAccessToken(response.access_token);

		setUser({
			id: response.id,
			name: response.name,
			email: response.email
		});

		setIsAuthenticated(true);
		setInitialized(true);
	};

	const signIn = async (data: LoginRequest) => {
		const response = await login(data);

		setAccessToken(response.access_token);
		setUser(response.user);
		setIsAuthenticated(true);
		setInitialized(true);
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
				signUp
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}
