// nftStore.ts
import { derived, writable, get } from 'svelte/store';
import type { DelegateAccountType, NftMetadata } from '$lib/types';
import { walletStore } from '@aztemi/svelte-on-solana-wallet-adapter-core';

interface NftStore {
	data: NftMetadata[] | undefined;
	delegateAccount: DelegateAccountType | null;
	owner: string | undefined;
	isFetching: boolean;
}

const createNftStore = () => {
	const { subscribe, set, update } = writable<NftStore>({
		data: undefined,
		owner: undefined,
		isFetching: false,
		delegateAccount: null
	});

	const fetchNftsFromServer = async (publicKey: string) => {
		try {
			update((store) => ({ ...store, isFetching: true }));
			const res = await fetch(`/api/fetchNftsV2/${publicKey}`);
			const data = await res.json();
			if (data.error) {
				throw new Error(data.error);
			}

			set({ data: data.nfts, owner: publicKey, isFetching: false, delegateAccount: data.delegateAccount });
		} catch (err) {
			console.error(err);
		}
	};

	return {
		subscribe,
		fetchNftsFromServer,
		clear: () => set({ data: undefined, owner: undefined, isFetching: false, delegateAccount: null })
	};
};

export const nftStore = createNftStore();

export const nftSyncStore = derived(
	walletStore,
	($walletStore) => {
		if (
			$walletStore.wallet?.connected &&
			!$walletStore.connecting &&
			$walletStore.wallet.publicKey &&
			$walletStore.wallet.publicKey.toBase58() !== get(nftStore).owner
		) {
			console.log('fetching nfts', $walletStore.wallet.publicKey.toBase58());
			nftStore.fetchNftsFromServer($walletStore.wallet.publicKey.toBase58());
		}
	},
	[]
);

export const nftWalletDisconnectListener = derived(
	walletStore,
	($walletStore) => {
		if (!$walletStore.wallet?.connected) {
			nftStore.clear();
		}
	},
	[]
);
