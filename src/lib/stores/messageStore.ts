import { writable } from 'svelte/store';

// This is your message store. The initial value is null, meaning no message is shown initially.
export const message = writable<string>();
