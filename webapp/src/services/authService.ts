/**
 * Authentication service for handling API calls
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface User {
	id: number;
	email: string;
	username: string;
	full_name: string;
	is_active: boolean;
	created_at: string;
	updated_at: string | null;
}

export interface LoginRequest {
	username: string;
	password: string;
}

export interface RegisterRequest {
	email: string;
	username: string;
	password: string;
	full_name?: string;
}

export interface AuthResponse {
	access_token: string;
	token_type: string;
	user: User;
}

class AuthService {
	private token: string | null = null;

	constructor() {
		// Load token from localStorage on initialization
		this.token = localStorage.getItem('auth_token');
	}

	/**
	 * Register a new user
	 */
	async register(data: RegisterRequest): Promise<User> {
		const response = await fetch(`${API_URL}/auth/register`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.detail || 'Registration failed');
		}

		return response.json();
	}

	/**
	 * Login user and store token
	 */
	async login(data: LoginRequest): Promise<AuthResponse> {
		const response = await fetch(`${API_URL}/auth/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.detail || 'Login failed');
		}

		const authResponse: AuthResponse = await response.json();

		// Store token
		this.token = authResponse.access_token;
		localStorage.setItem('auth_token', authResponse.access_token);
		localStorage.setItem('user', JSON.stringify(authResponse.user));

		return authResponse;
	}

	/**
	 * Logout user and clear token
	 */
	logout(): void {
		this.token = null;
		localStorage.removeItem('auth_token');
		localStorage.removeItem('user');
	}

	/**
	 * Get current token
	 */
	getToken(): string | null {
		return this.token;
	}

	/**
	 * Get current user from localStorage
	 */
	getCurrentUser(): User | null {
		const userStr = localStorage.getItem('user');
		if (!userStr) return null;

		try {
			return JSON.parse(userStr);
		} catch {
			return null;
		}
	}

	/**
	 * Check if user is authenticated
	 */
	isAuthenticated(): boolean {
		return !!this.token;
	}

	/**
	 * Get authorization headers
	 */
	getAuthHeaders(): Record<string, string> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};

		if (this.token) {
			headers['Authorization'] = `Bearer ${this.token}`;
		}

		return headers;
	}

	/**
	 * Verify token is still valid
	 */
	async verifyToken(): Promise<boolean> {
		if (!this.token) return false;

		try {
			const response = await fetch(`${API_URL}/auth/verify`, {
				headers: this.getAuthHeaders(),
			});

			return response.ok;
		} catch {
			return false;
		}
	}

	/**
	 * Get current user profile from API
	 */
	async getProfile(): Promise<User> {
		const response = await fetch(`${API_URL}/auth/me`, {
			headers: this.getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error('Failed to fetch profile');
		}

		const user = await response.json();
		localStorage.setItem('user', JSON.stringify(user));
		return user;
	}
}

export const authService = new AuthService();

/**
 * Helper function to get auth headers
 */
export function getAuthHeaders(): Record<string, string> {
	return authService.getAuthHeaders();
}
