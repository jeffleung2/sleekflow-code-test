import { useSnackbar, type VariantType } from 'notistack';

/**
 * Custom hook for showing notifications
 * Wraps notistack's enqueueSnackbar with a simpler interface
 */
export const useNotification = () => {
	const { enqueueSnackbar } = useSnackbar();

	const showNotification = (
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

	return {
		showSuccess: (message: string) => showNotification(message, 'success'),
		showError: (message: string) => showNotification(message, 'error'),
		showWarning: (message: string) => showNotification(message, 'warning'),
		showInfo: (message: string) => showNotification(message, 'info'),
		showNotification,
	};
};
