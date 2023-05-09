import type { NftMetadata } from '$lib/types';
import { writable } from 'svelte/store';

interface NftStore {
	data: NftMetadata[] | undefined;
    owner: string | undefined;
}

const createNftStore = () => {
	const { subscribe, set } = writable<NftStore>({
		data: undefined,
        owner: undefined
	});

	return {
		subscribe,
		setNfts: (nfts: NftMetadata[], owner: string) => set({ data: nfts, owner: owner }),
		clear: () => set({ data: undefined, owner: undefined })
	};
};

export const nftStore = createNftStore();
