import { Votebank } from '$lib/anchor/accounts';
import type { ProposalItem, VoteBankProposals } from '$lib/types';
import { fetchProposals, getEnvNetwork } from '$lib/utils/solana';
import { web3 } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { error } from '@sveltejs/kit';

export async function load({ params, setHeaders }: any) {
	const address = params.address;
	console.log('address', address);
	// list content will just return all proposals
	// page data will be that proposal specific data
	let data: Votebank;
	let responseData: VoteBankProposals;
	try {
		//TODO: Configurable/env variable
		const connection = getEnvNetwork();
		data = await Votebank.fromAccountAddress(connection, new web3.PublicKey(address));
		let open_proposals: ProposalItem[] = [];
		let closed_proposals: ProposalItem[] = [];
		if (data.openProposals && data.openProposals.length > 0) {
			const openProposalRaw = await fetchProposals(
				connection,
				new PublicKey(address),
				data.openProposals
			);
			console.log('openProposalRaw', openProposalRaw);
			open_proposals = openProposalRaw;
		}
		if (data.closedProposals && data.closedProposals.length > 0) {
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
			closed_proposals: closed_proposals.sort((a, b) => b.endTime - a.endTime)
		};
		setHeaders({
			'cache-control': 'public, max-age=3600' // 1 hour - increase the max age as you get more confident in your caching
		});
		return {
			json: responseData,
			address
		};
	} catch (err) {
		error(400, 'Bad Request');
	}

	// } catch (err) {
	// 	console.error('error fetching blog post at [slug].svelte: ' + slug, res, err);
	// 	throw error(500, 'error fetching blog post at [slug].svelte: ' + slug + ': ' + res);
	// }
}
