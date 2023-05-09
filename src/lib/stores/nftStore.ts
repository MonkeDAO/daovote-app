import type { NftMetadata } from '$lib/types';
import { writable } from 'svelte/store';

interface NftStore {
	data: NftMetadata[];
}

const createNftStore = () => {
	const { subscribe, set } = writable<NftStore>({
		data: []
	});

	return {
		subscribe,
		setNfts: (nfts: NftMetadata[]) => set({ data: nfts }),
		clear: () => set({ data: [] })
	};
};

export const nftStore = createNftStore();
