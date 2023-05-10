import { writable } from 'svelte/store';

// This is your store. The initial value is false, meaning no loading is happening initially.
export const loading = writable(false);
