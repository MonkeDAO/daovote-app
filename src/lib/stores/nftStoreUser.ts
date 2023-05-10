import { derived, type Readable } from 'svelte/store';
import type { WalletStore } from '@svelte-on-solana/wallet-adapter-core';
import { nftStore, nftSyncStore } from './nftStore';

export const nftStoreUser = (walletStore: Readable<WalletStore>) => {
	return derived([walletStore, nftStore, nftSyncStore], ([$walletStore, $nftStore]) => {
		return {
			walletAddress: $walletStore?.publicKey?.toBase58() || null,
			nfts: $nftStore.data,
			isCurrentWallet: $walletStore?.publicKey
				? $walletStore.publicKey.toBase58() === $nftStore.owner
				: false
		};
	});
};
