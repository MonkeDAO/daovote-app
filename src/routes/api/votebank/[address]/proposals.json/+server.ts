import { Votebank } from '$lib/anchor/accounts';
import type { VoteBankProposalsNumeric } from '$lib/types';
import { web3 } from '@project-serum/anchor';
import { error } from '@sveltejs/kit';
/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function GET({ params }: any) {
	console.log("Fetching data for votebank address", params);
	const { address } = params;
    console.log("Fetching data for votebank address", address);
	let data: Votebank;
    let responseData: VoteBankProposalsNumeric;
	try {
        const connection = new web3.Connection(web3.clusterApiUrl('devnet'));
		data = await Votebank.fromAccountAddress(connection, new web3.PublicKey(address));
        responseData = {
            votebank: address,
            open_proposals: data.openProposals,
            closed_proposals: data.closedProposals,
        }
		return new Response(JSON.stringify(responseData), {
			headers: {
				'Cache-Control': `public, max-age=3600`, // 1 hour
			}
		});
	} catch (err) {
		console.log("didn't find ", address)
		console.error(err);
		throw error(404, 'votebank not found');
	}
}