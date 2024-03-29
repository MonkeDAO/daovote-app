// src/routes/votebank/[address]/+page.ts

import { Votebank } from '$lib/anchor/accounts';
import { getEnvNetwork } from '$lib/utils/solana';
import { PublicKey } from '@solana/web3.js';
import { PRIVATE_HELIUS_URL } from '$env/static/private';

/** @type {import('./$types').PageLoad} */
export async function load({ params }: any) {
	const { address } = params;
	const connection = getEnvNetwork(undefined, PRIVATE_HELIUS_URL);
	const voteBankAccountRaw = await Votebank.fromAccountAddress(connection, new PublicKey(address));
	const votebank = voteBankAccountRaw?.pretty();
	return {
		address,
		votebank
	};
}
