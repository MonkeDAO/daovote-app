import { writable } from 'svelte/store';
import type { NftMetadata } from './types';

const createSelectedNfts = () => {
	const { subscribe, set, update } = writable<NftMetadata[]>([]);

	return {
		subscribe,
		add: (nft: any) => update((currentSelectedNfts) => [...currentSelectedNfts, nft]),
		remove: (address: any) =>
			update((currentSelectedNfts) =>
				currentSelectedNfts.filter((nft: any) => nft.address !== address)
			),
		reset: () => set([])
	};
};

export const selectedNfts = createSelectedNfts();
