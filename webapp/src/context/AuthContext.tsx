/**
 * Authentication context for managing user state
 */

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import type { User, LoginRequest, RegisterRequest } from '../services/authService';
import { showSuccess, showError } from '../utils/notification';

interface AuthContextType {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (data: LoginRequest) => Promise<void>;
	register: (data: RegisterRequest) => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Check if user is already logged in on mount
		const initAuth = async () => {
			const currentUser = authService.getCurrentUser();

			if (currentUser && authService.getToken()) {
				// Verify token is still valid
				const isValid = await authService.verifyToken();
				if (isValid) {
					setUser(currentUser);
				} else {
					// Token expired, logout
					authService.logout();
				}
			}

			setIsLoading(false);
		};

		initAuth();
	}, []);

	const login = async (data: LoginRequest) => {
		try {
			const response = await authService.login(data);
			setUser(response.user);
			showSuccess('Logged in successfully');
		} catch (error: any) {
			const errorMessage = error.message || 'Login failed';
			showError(errorMessage);
			throw error;
		}
	};

	const register = async (data: RegisterRequest) => {
		try {
			await authService.register(data);
			showSuccess('Registration successful! Logging you in...');
			// After registration, automatically log in
			await login({ username: data.username, password: data.password });
		} catch (error: any) {
			const errorMessage = error.message || 'Registration failed';
			showError(errorMessage);
			throw error;
		}
	};

	const logout = () => {
		authService.logout();
		setUser(null);
		showSuccess('Logged out successfully');
	};

	const value: AuthContextType = {
		user,
		isAuthenticated: !!user,
		isLoading,
		login,
		register,
		logout,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
