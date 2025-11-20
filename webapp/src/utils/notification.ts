import { enqueueSnackbar, type VariantType } from 'notistack';

/**
 * Utility function to show notifications from anywhere in the app
 * Can be used outside of React components (e.g., in Zustand stores)
 */
export const showNotification = (
	message: string,
	variant: VariantType = 'default'
) => {
	enqueueSnackbar(message, {
		variant,
		anchorOrigin: {
			vertical: 'bottom',
			horizontal: 'left',
		},
		autoHideDuration: 4000,
	});
};

export const showSuccess = (message: string) => showNotification(message, 'success');
export const showError = (message: string) => showNotification(message, 'error');
export const showWarning = (message: string) => showNotification(message, 'warning');
export const showInfo = (message: string) => showNotification(message, 'info');
