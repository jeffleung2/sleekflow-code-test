import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';

/**
 * Custom render function that wraps components with necessary providers
 */
export function renderWithProviders(
	ui: ReactElement,
	options?: Omit<RenderOptions, 'wrapper'>
) {
	function Wrapper({ children }: { children: React.ReactNode }) {
		return <SnackbarProvider>{children}</SnackbarProvider>;
	}

	return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Mock fetch responses
 */
export function mockFetch(data: any, ok = true, status = 200) {
	return vi.fn(() =>
		Promise.resolve({
			ok,
			status,
			json: () => Promise.resolve(data),
		} as Response)
	);
}

/**
 * Mock failed fetch responses
 */
export function mockFetchError(message: string, status = 400) {
	return vi.fn(() =>
		Promise.resolve({
			ok: false,
			status,
			json: () => Promise.resolve({ detail: message }),
		} as Response)
	);
}

// Re-export everything
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
