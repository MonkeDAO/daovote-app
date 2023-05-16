import { message } from '$lib/stores/messageStore';
import { loading as loadingStore } from '$lib/stores/loadingStore';
import { sleep } from './solana';

export function reset() {
	loadingStore.set(false);
	message.set('');
}
export async function setMessageSlow(msg: string, delay = 500) {
	message.set(msg);
	await sleep(delay);
}
