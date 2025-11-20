import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
	cleanup();
});

// Mock environment variables
vi.mock('import.meta', () => ({
	env: {
		VITE_API_URL: 'http://localhost:8080',
	},
}));

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};

	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value.toString();
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		},
	};
})();

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock,
});

// Mock window.confirm
global.confirm = vi.fn(() => true);

// Mock console methods to reduce noise in tests
global.console = {
	...console,
	error: vi.fn(),
	warn: vi.fn(),
};
