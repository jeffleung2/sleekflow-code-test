import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../services/authService';
import type { User, LoginRequest, RegisterRequest } from '../services/authService';

describe('AuthService', () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear();
		// Reset fetch mock
		global.fetch = vi.fn();
	});

	describe('register', () => {
		it('should register a new user successfully', async () => {
			const mockUser: User = {
				id: 1,
				email: 'test@example.com',
				username: 'testuser',
				full_name: 'Test User',
				is_active: true,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: null,
			};

			const registerData: RegisterRequest = {
				email: 'test@example.com',
				username: 'testuser',
				password: 'password123',
				full_name: 'Test User',
			};

			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockUser),
				} as Response)
			);

			const result = await authService.register(registerData);

			expect(result).toEqual(mockUser);
			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8080/auth/register',
				expect.objectContaining({
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(registerData),
				})
			);
		});

		it('should throw error on registration failure', async () => {
			const registerData: RegisterRequest = {
				email: 'test@example.com',
				username: 'testuser',
				password: 'password123',
			};

			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: false,
					json: () => Promise.resolve({ detail: 'User already exists' }),
				} as Response)
			);

			await expect(authService.register(registerData)).rejects.toThrow(
				'User already exists'
			);
		});
	});

	describe('login', () => {
		it('should login successfully and store token', async () => {
			const mockUser: User = {
				id: 1,
				email: 'test@example.com',
				username: 'testuser',
				full_name: 'Test User',
				is_active: true,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: null,
			};

			const mockAuthResponse = {
				access_token: 'test-token-123',
				token_type: 'bearer',
				user: mockUser,
			};

			const loginData: LoginRequest = {
				username: 'testuser',
				password: 'password123',
			};

			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockAuthResponse),
				} as Response)
			);

			const result = await authService.login(loginData);

			expect(result).toEqual(mockAuthResponse);
			expect(localStorage.getItem('auth_token')).toBe('test-token-123');
			expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
			expect(authService.getToken()).toBe('test-token-123');
		});

		it('should throw error on login failure', async () => {
			const loginData: LoginRequest = {
				username: 'testuser',
				password: 'wrongpassword',
			};

			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: false,
					json: () => Promise.resolve({ detail: 'Invalid credentials' }),
				} as Response)
			);

			await expect(authService.login(loginData)).rejects.toThrow(
				'Invalid credentials'
			);
		});
	});

	describe('logout', () => {
		it('should clear token and user data', () => {
			// Set up initial state
			localStorage.setItem('auth_token', 'test-token');
			localStorage.setItem('user', JSON.stringify({ id: 1 }));

			authService.logout();

			expect(localStorage.getItem('auth_token')).toBeNull();
			expect(localStorage.getItem('user')).toBeNull();
			expect(authService.getToken()).toBeNull();
		});
	});

	describe('getToken', () => {
		it('should return stored token', () => {
			const token = 'test-token-123';
			localStorage.setItem('auth_token', token);

			// Create new instance to load token
			const newService = new (authService.constructor as any)();
			expect(newService.getToken()).toBe(token);
		});

		it('should return null when no token', () => {
			expect(authService.getToken()).toBeNull();
		});
	});

	describe('getCurrentUser', () => {
		it('should return parsed user from localStorage', () => {
			const mockUser: User = {
				id: 1,
				email: 'test@example.com',
				username: 'testuser',
				full_name: 'Test User',
				is_active: true,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: null,
			};

			localStorage.setItem('user', JSON.stringify(mockUser));

			const result = authService.getCurrentUser();
			expect(result).toEqual(mockUser);
		});

		it('should return null when no user stored', () => {
			const result = authService.getCurrentUser();
			expect(result).toBeNull();
		});

		it('should return null on invalid JSON', () => {
			localStorage.setItem('user', 'invalid-json');
			const result = authService.getCurrentUser();
			expect(result).toBeNull();
		});
	});

	describe('isAuthenticated', () => {
		it('should return true when token exists', () => {
			localStorage.setItem('auth_token', 'test-token');
			const newService = new (authService.constructor as any)();
			expect(newService.isAuthenticated()).toBe(true);
		});

		it('should return false when no token', () => {
			expect(authService.isAuthenticated()).toBe(false);
		});
	});

	describe('getAuthHeaders', () => {
		it('should return headers with Authorization when authenticated', () => {
			localStorage.setItem('auth_token', 'test-token-123');
			const newService = new (authService.constructor as any)();

			const headers = newService.getAuthHeaders();

			expect(headers).toEqual({
				'Content-Type': 'application/json',
				Authorization: 'Bearer test-token-123',
			});
		});

		it('should return headers without Authorization when not authenticated', () => {
			const headers = authService.getAuthHeaders();

			expect(headers).toEqual({
				'Content-Type': 'application/json',
			});
		});
	});

	describe('verifyToken', () => {
		it('should return true for valid token', async () => {
			localStorage.setItem('auth_token', 'valid-token');
			const newService = new (authService.constructor as any)();

			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: true,
				} as Response)
			);

			const result = await newService.verifyToken();
			expect(result).toBe(true);
		});

		it('should return false for invalid token', async () => {
			localStorage.setItem('auth_token', 'invalid-token');
			const newService = new (authService.constructor as any)();

			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: false,
				} as Response)
			);

			const result = await newService.verifyToken();
			expect(result).toBe(false);
		});

		it('should return false when no token', async () => {
			const result = await authService.verifyToken();
			expect(result).toBe(false);
		});

		it('should return false on network error', async () => {
			localStorage.setItem('auth_token', 'test-token');
			const newService = new (authService.constructor as any)();

			global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

			const result = await newService.verifyToken();
			expect(result).toBe(false);
		});
	});

	describe('getProfile', () => {
		it('should fetch and store user profile', async () => {
			const mockUser: User = {
				id: 1,
				email: 'test@example.com',
				username: 'testuser',
				full_name: 'Test User',
				is_active: true,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: null,
			};

			localStorage.setItem('auth_token', 'test-token');
			const newService = new (authService.constructor as any)();

			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockUser),
				} as Response)
			);

			const result = await newService.getProfile();

			expect(result).toEqual(mockUser);
			expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
		});

		it('should throw error on profile fetch failure', async () => {
			localStorage.setItem('auth_token', 'test-token');
			const newService = new (authService.constructor as any)();

			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: false,
				} as Response)
			);

			await expect(newService.getProfile()).rejects.toThrow(
				'Failed to fetch profile'
			);
		});
	});
});
