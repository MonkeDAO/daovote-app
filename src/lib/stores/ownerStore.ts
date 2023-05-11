import { writable, derived } from 'svelte/store';
import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
import { Connection, PublicKey, clusterApiUrl, type Cluster } from '@solana/web3.js';
import { Votebank } from '$lib/anchor/accounts';
import { isSettingsDataOwnerInfo } from '$lib/anchor/types';
import { VOTEBANK } from '$lib/siteConfig';
import { PUBLIC_SOLANA_NETWORK } from '$env/static/public';

interface OwnerCheckStore {
	isOwner: boolean;
}

const createOwnerCheckStore = () => {
	const { subscribe, set } = writable<OwnerCheckStore>({ isOwner: false });

	const checkIsOwner = async (publicKey: PublicKey) => {
		console.log('checking', publicKey.toBase58());
		//Loaded client side need public var
		const connection = new Connection(clusterApiUrl(PUBLIC_SOLANA_NETWORK as Cluster), 'confirmed');
		const voteBankAccountRaw = await Votebank.fromAccountAddress(
			connection,
			new PublicKey(VOTEBANK)
		);
		const votebank = voteBankAccountRaw?.pretty();
		const ownerInfo = votebank?.settings.find((x) => isSettingsDataOwnerInfo(x));
		const owners: PublicKey[] = [];
		if (ownerInfo) {
			owners.push(...(isSettingsDataOwnerInfo(ownerInfo) ? ownerInfo.owners : []));
		}
		const isOwner = owners.some((owner) => owner.toBase58() === publicKey.toBase58());
		set({ isOwner });
	};

	return {
		subscribe,
		checkIsOwner
	};
};

export const ownerCheckStore = createOwnerCheckStore();

export const ownerCheckSyncStore = derived(
	walletStore,
	($walletStore, set) => {
		if ($walletStore.wallet?.connected && $walletStore.wallet.publicKey) {
			ownerCheckStore.checkIsOwner($walletStore.wallet.publicKey);
		} else {
			set({ isOwner: false });
		}
	},
	{ isOwner: false }
);
