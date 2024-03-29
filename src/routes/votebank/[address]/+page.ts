// src/routes/votebank/[address]/+page.ts

import { Votebank } from '$lib/anchor/accounts';
import { getEnvNetwork } from '$lib/utils/solana';
import { PublicKey } from '@solana/web3.js';

/** @type {import('./$types').PageLoad} */
export async function load({ params }: any) {
	const { address } = params;
	const connection = getEnvNetwork();
	const voteBankAccountRaw = await Votebank.fromAccountAddress(connection, new PublicKey(address));
	const votebank = voteBankAccountRaw?.pretty();
	return {
		address,
		votebank
	};
}
