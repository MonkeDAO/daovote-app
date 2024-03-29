// src/routes/votebank/[address]/+page.ts

import { PRIVATE_HELIUS_URL } from '$env/static/private';
import { Votebank } from '$lib/anchor/accounts';
import { fetchProposalById, getEnvNetwork } from '$lib/utils/solana';
import { PublicKey } from '@solana/web3.js';

/** @type {import('./$types').PageLoad} */
export async function load({ params }: any) {
	const { id, address } = params;
	const connection = getEnvNetwork(undefined, PRIVATE_HELIUS_URL);
	const voteBankAccountRaw = await Votebank.fromAccountAddress(connection, new PublicKey(address));
	const votebank = voteBankAccountRaw?.pretty();
	// const ownerInfo = votebank?.settings.find((x) => isSettingsDataOwnerInfo(x));
	// const owners: PublicKey[] = [];
	// if (ownerInfo) {
	// 	owners.push(...(isSettingsDataOwnerInfo(ownerInfo) ? ownerInfo.owners : []));
	// }
	let data = null;
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			data = await fetchProposalById(connection, new PublicKey(address), id);
			if (data) break; // Exit loop if data is successfully fetched
		} catch (error) {
			console.log(`Attempt ${attempt + 1} failed:`, error);
			if (attempt === 2) throw error; // Rethrow error on last attempt
		}
	}
	console.log('load proposal/id', data, id, address);
	return {
		address,
		id,
		proposal: data,
		//owners: owners,
		voteBankSettings: votebank?.settings
	};
}
