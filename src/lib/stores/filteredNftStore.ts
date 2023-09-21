import { writable } from 'svelte/store';
import type { NftMetadata, ProposalItem } from '$lib/types';
import type { Connection } from '@solana/web3.js';
import type { SettingsData } from '$lib/anchor/types';
import { extractRestrictionData } from '$lib/utils/solana';

interface FilteredNftStore {
	eligible: NftMetadata[] | undefined;
	ineligible: NftMetadata[] | undefined;
	isFetching: boolean;
}

const createFilteredNftStore = () => {
	const { subscribe, set, update } = writable<FilteredNftStore>({
		eligible: undefined,
		ineligible: undefined,
		isFetching: false
	});

	const filterNfts = async (
		connection: Connection,
		proposal: ProposalItem,
		votebankSettings: SettingsData[],
		nfts: NftMetadata[]
	) => {
		const voteBankSetting = extractRestrictionData(votebankSettings);
		if (voteBankSetting.isNftRestricted && voteBankSetting.restrictionMint && nfts) {
			const filteredNfts = nfts.filter((nft) => {
				return nft.collection?.address === voteBankSetting.restrictionMint.toBase58();
			});
			update((store) => ({ ...store, isFetching: true }));
			await fetchAccountIfExists(connection, proposal, filteredNfts);
		}
	};

	async function fetchAccountIfExists(
		connection: Connection,
		proposal: ProposalItem,
		filteredNfts: NftMetadata[]
	) {
		if (connection && proposal) {
			console.log('fetching', filteredNfts);
			const response = await fetch('/api/filterNfts', {
				method: 'POST',
				body: JSON.stringify({ nfts: filteredNfts, proposal })
			});
			const data = await response.json();
			if (data.error) {
				console.log('problem', data.error, data);
				update((store) => {
					store.eligible = [];
					store.ineligible = [];
					return store;
				});
			}
			const nftsVoteAccounts: { nft: NftMetadata; accountExists: boolean }[] = data;
			const nftsFiltered = nftsVoteAccounts
				.filter(({ accountExists }) => !accountExists)
				.map(({ nft }) => { return { ...nft, eligible: true } });

			const ineligibleNfts = nftsVoteAccounts
				.filter(({ accountExists }) => accountExists)
				.map(({ nft }) => { return { ...nft, eligible: false } });

			update((store) => {
				store.eligible = nftsFiltered;
				store.ineligible = ineligibleNfts;
				store.isFetching = false;
				return store;
			});
		}
	}

	const pushIneligible = (nfts: NftMetadata[]) => {
		update((store) => {
			const inelegibleToPush = nfts.map((nft) => { return { ...nft, eligible: false } });
			store.eligible = store?.eligible?.filter((nft) => !inelegibleToPush.some(x => x.address === nft.address));
			store.ineligible = [...store?.ineligible ?? [], ...inelegibleToPush];
			return store;
		});
	}

	return {
		subscribe,
		filterNfts,
		pushIneligible,
		clear: () => set({ eligible: undefined, ineligible: undefined, isFetching: false })
	};
};

export const filteredNftStore = createFilteredNftStore();
