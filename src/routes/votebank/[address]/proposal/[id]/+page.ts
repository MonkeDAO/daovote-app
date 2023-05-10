// src/routes/votebank/[address]/+page.ts

import { Votebank } from '$lib/anchor/accounts';
import { isSettingsDataOwnerInfo, type SettingsDataRecord } from '$lib/anchor/types';
import { fetchProposalById } from '$lib/utils/solana';
import { web3 } from '@project-serum/anchor';
import { PublicKey, clusterApiUrl } from '@solana/web3.js';

/** @type {import('./$types').PageLoad} */
export async function load({ params }: any) {
	const { id, address } = params;
	const connection = new web3.Connection(clusterApiUrl('devnet'));
	const voteBankAccountRaw = await Votebank.fromAccountAddress(connection, new PublicKey(address));
	const votebank = voteBankAccountRaw?.pretty();
	// const ownerInfo = votebank?.settings.find((x) => isSettingsDataOwnerInfo(x));
	// const owners: PublicKey[] = [];
	// if (ownerInfo) {
	// 	owners.push(...(isSettingsDataOwnerInfo(ownerInfo) ? ownerInfo.owners : []));
	// }
	const data = await fetchProposalById(connection, new PublicKey(address), id);
	console.log('load proposal/id', data, id, address);
	return {
		address,
		id,
		proposal: data,
		//owners: owners,
		voteBankSettings: votebank?.settings
	};
}
