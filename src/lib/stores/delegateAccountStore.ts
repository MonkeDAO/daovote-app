// nftStore.ts
import { writable } from 'svelte/store';
//import { walletStore } from '@aztemi/svelte-on-solana-wallet-adapter-core';
import type { DelegateAccountType } from '$lib/types';

interface DelegateAccountStore {
	data: DelegateAccountType | undefined;
	owner: string | undefined;
	isFetching: boolean;
}

const createDelegateAccountStore = () => {
	const { subscribe, set, update } = writable<DelegateAccountStore>({
		data: undefined,
		owner: undefined,
		isFetching: false
	});

	const fetchDelegateFromServer = async (publicKey: string) => {
		try {
			update((store) => ({ ...store, isFetching: true }));
			const res = await fetch(`/api/fetchDelegate/${publicKey}`);
			const data = await res.json();
			if (data.error) {
				throw new Error(data.error);
			}

			set({ data: data.delegateAccount, owner: publicKey, isFetching: false });
		} catch (err) {
			console.error(err);
		}
	};

	return {
		subscribe,
		fetchDelegateFromServer,
		clear: () => set({ data: undefined, owner: undefined, isFetching: false })
	};
};

export const delegateAccountStore = createDelegateAccountStore();