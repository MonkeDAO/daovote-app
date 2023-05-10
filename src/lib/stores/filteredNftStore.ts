import { writable } from 'svelte/store';
import type { NftMetadata, ProposalItem } from '$lib/types';
import { PublicKey, type Connection } from '@solana/web3.js';
import type { SettingsData } from '$lib/anchor/types';
import { extractRestrictionData, voteAccountPdaExists } from '$lib/utils/solana';

interface FilteredNftStore {
    eligible: NftMetadata[] | undefined;
    ineligible: NftMetadata[] | undefined;
}

const createFilteredNftStore = () => {
	const { subscribe, set, update } = writable<FilteredNftStore>({
		eligible: undefined,
		ineligible: undefined,
	});

	const filterNfts = async (connection: Connection, proposal: ProposalItem, votebankSettings: SettingsData[], nfts: NftMetadata[]) => {
        const voteBankSetting = extractRestrictionData(votebankSettings);
        if (voteBankSetting.isNftRestricted && voteBankSetting.restrictionMint && nfts) {
            const filteredNfts = nfts.filter((nft) => {
                return nft.collection?.address === voteBankSetting.restrictionMint.toBase58();
            });
            await fetchAccountIfExists(connection, proposal, filteredNfts);
        }
    };

    async function checkVoteAccount(connection: Connection, proposal: ProposalItem, nft: NftMetadata) {
		const accountExists = await voteAccountPdaExists(
			connection,
			new PublicKey(proposal.votebank),
			new PublicKey(nft.address),
			proposal.proposalId
		);
		return { nft, accountExists };
	}

	async function fetchAccountIfExists(connection: Connection, proposal: ProposalItem, filteredNfts: NftMetadata[]) {
		if (connection && proposal) {
			const nftsVoteAccounts = await Promise.all(filteredNfts.map(nft => checkVoteAccount(connection, proposal, nft)));
			const nftsFiltered = nftsVoteAccounts
				.filter(({ accountExists }) => !accountExists)
				.map(({ nft }) => nft);
			const ineligibleNfts = nftsVoteAccounts
				.filter(({ accountExists }) => accountExists)
				.map(({ nft }) => nft);
			update(store => {
                store.eligible = nftsFiltered;
                store.ineligible = ineligibleNfts;
                return store;
            });
		}
	}

	return {
		subscribe,
		filterNfts,
		clear: () => set({ eligible: undefined, ineligible: undefined }),
	};
};

export const filteredNftStore = createFilteredNftStore();
