import { error } from '@sveltejs/kit';
import { web3 } from '@project-serum/anchor';
import { PublicKey, clusterApiUrl } from '@solana/web3.js';
import { VOTEBANK } from '$lib/siteConfig';
import { Votebank } from '$lib/anchor/accounts';
import type { VoteBankProposals } from '$lib/types';
import { fetchProposals } from '$lib/utils/solana';
// export const prerender = true; // turned off bc it causes errors

export async function load({ setHeaders }: any) {
	let data: Votebank;
	const address = VOTEBANK;
	let responseData: VoteBankProposals;

	try {
		//TODO: Configurable/env variable
		const connection = new web3.Connection(clusterApiUrl('devnet'));
		data = await Votebank.fromAccountAddress(connection, new web3.PublicKey(address));
		let open_proposals: any[] = [];
		let closed_proposals: any[] = [];
		if (data.openProposals && data.openProposals.length > 0) {
			const openProposalRaw = await fetchProposals(
				connection,
				new PublicKey(address),
				data.openProposals
			);
			console.log('openProposalRaw', openProposalRaw);
			open_proposals = openProposalRaw;
		}
		if (data.openProposals && data.openProposals.length > 0) {
			const closedProposalRaw = await fetchProposals(
				connection,
				new PublicKey(address),
				data.closedProposals
			);
			closed_proposals = closedProposalRaw;
		}
		console.log('returning proposals', address, open_proposals, closed_proposals);
		responseData = {
			votebank: address,
			open_proposals: open_proposals,
			closed_proposals: closed_proposals
		};
		setHeaders({
			'cache-control': 'public, max-age=3600' // 1 hour - increase the max age as you get more confident in your caching
		});
		return {
			json: responseData,
			address
		};
	} catch (err) {
		throw error(400, 'Bad Request');
	}
}
