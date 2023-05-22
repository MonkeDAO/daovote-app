import { writable } from 'svelte/store';

interface UploadRequest {
	isSubmitting: boolean;
	isSuccess: boolean;
	isError: boolean;
	errorMessage: string;
}

const createUploadRequestStore = () => {
	const { subscribe, set, update } = writable<UploadRequest>({
		isSubmitting: false,
		isSuccess: false,
		isError: false,
		errorMessage: ''
	});

	const submitRequest = () => {
		update((store) => ({ ...store, isSubmitting: true }));
	};
	const submitSuccess = () => {
		update((store) => ({ ...store, isSubmitting: false, isSuccess: true }));
	};
	const submitError = (message: string) => {
		update((store) => ({ ...store, isSubmitting: false, isError: true, errorMessage: message }));
	};

	return {
		subscribe,
		submitRequest,
		submitSuccess,
		submitError,
		clear: () => set({ isSubmitting: false, isSuccess: false, isError: false, errorMessage: '' })
	};
};

export const uploadRequestStore = createUploadRequestStore();
