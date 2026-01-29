import toast from 'react-hot-toast';

/**
 * Toast notification utilities
 * Provides consistent toast notifications across the application
 */

export const showSuccess = (message) => {
    toast.success(message, {
        duration: 3000,
        position: 'top-right',
    });
};

export const showError = (message) => {
    toast.error(message, {
        duration: 4000,
        position: 'top-right',
    });
};

export const showInfo = (message) => {
    toast(message, {
        duration: 3000,
        position: 'top-right',
        icon: 'ℹ️',
    });
};

export const showLoading = (message) => {
    return toast.loading(message, {
        position: 'top-right',
    });
};

export const dismissToast = (toastId) => {
    toast.dismiss(toastId);
};

export const showPromise = (promise, messages) => {
    return toast.promise(
        promise,
        {
            loading: messages.loading || 'Loading...',
            success: messages.success || 'Success!',
            error: messages.error || 'Error occurred',
        },
        {
            position: 'top-right',
        }
    );
};

export default {
    success: showSuccess,
    error: showError,
    info: showInfo,
    loading: showLoading,
    dismiss: dismissToast,
    promise: showPromise,
};
