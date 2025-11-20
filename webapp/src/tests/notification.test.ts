import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	showNotification,
	showSuccess,
	showError,
	showWarning,
	showInfo,
} from '../utils/notification';
import { enqueueSnackbar } from 'notistack';

// Mock notistack
vi.mock('notistack', () => ({
	enqueueSnackbar: vi.fn(),
}));

describe('Notification Utils', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('showNotification', () => {
		it('should call enqueueSnackbar with correct params', () => {
			showNotification('Test message', 'info');

			expect(enqueueSnackbar).toHaveBeenCalledWith('Test message', {
				variant: 'info',
				anchorOrigin: {
					vertical: 'bottom',
					horizontal: 'left',
				},
				autoHideDuration: 4000,
			});
		});

		it('should use default variant when not specified', () => {
			showNotification('Test message');

			expect(enqueueSnackbar).toHaveBeenCalledWith(
				'Test message',
				expect.objectContaining({
					variant: 'default',
				})
			);
		});
	});

	describe('showSuccess', () => {
		it('should call showNotification with success variant', () => {
			showSuccess('Success message');

			expect(enqueueSnackbar).toHaveBeenCalledWith(
				'Success message',
				expect.objectContaining({
					variant: 'success',
				})
			);
		});
	});

	describe('showError', () => {
		it('should call showNotification with error variant', () => {
			showError('Error message');

			expect(enqueueSnackbar).toHaveBeenCalledWith(
				'Error message',
				expect.objectContaining({
					variant: 'error',
				})
			);
		});
	});

	describe('showWarning', () => {
		it('should call showNotification with warning variant', () => {
			showWarning('Warning message');

			expect(enqueueSnackbar).toHaveBeenCalledWith(
				'Warning message',
				expect.objectContaining({
					variant: 'warning',
				})
			);
		});
	});

	describe('showInfo', () => {
		it('should call showNotification with info variant', () => {
			showInfo('Info message');

			expect(enqueueSnackbar).toHaveBeenCalledWith(
				'Info message',
				expect.objectContaining({
					variant: 'info',
				})
			);
		});
	});

	describe('notification configuration', () => {
		it('should have correct anchor origin', () => {
			showNotification('Test');

			expect(enqueueSnackbar).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({
					anchorOrigin: {
						vertical: 'bottom',
						horizontal: 'left',
					},
				})
			);
		});

		it('should have correct auto hide duration', () => {
			showNotification('Test');

			expect(enqueueSnackbar).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({
					autoHideDuration: 4000,
				})
			);
		});
	});
});
