import { type Readable, derived } from 'svelte/store';
import type { WalletStore } from '@svelte-on-solana/wallet-adapter-core';
import { nftStore } from './nftStore';

export const nftStoreUser = (walletStore: Readable<WalletStore>) => {
	return derived([walletStore, nftStore], ([$walletStore, $nftStore]) => {
		return {
			walletAddress: $walletStore?.publicKey || null,
			nfts: $nftStore.data
		};
	});
};
