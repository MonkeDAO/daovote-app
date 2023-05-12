// src/routes/+your-page/fetchNfts.ts
import { Metaplex, guestIdentity, type Metadata, PublicKey } from '@metaplex-foundation/js';
import type { RequestHandler } from '@sveltejs/kit';
import { web3 } from '@project-serum/anchor';
import type { NftMetadata, ProposalItem } from '$lib/types';
import { chunkArray, getEnvNetwork, sleep, voteAccountPdaExists } from '$lib/utils/solana';
import type { Connection } from '@solana/web3.js';

async function checkVoteAccount(
    connection: Connection,
    proposal: ProposalItem,
    nft: NftMetadata
) {
    const accountExists = await voteAccountPdaExists(
        connection,
        new PublicKey(proposal.votebank),
        new PublicKey(nft.address),
        proposal.proposalId
    );
    return { nft, accountExists };
}

export const POST: RequestHandler = async (req) => {

	const { nfts, proposal } = await req.request.json();
    if (!nfts || !(nfts as NftMetadata[])) {
        return new Response(JSON.stringify({ error: 'NFTs are required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
	const connection = getEnvNetwork();
	const chunkSize = 25; // Define your chunk size
	const delayBetweenChunks = 100; // Define delay in milliseconds

	const chunks = await chunkArray<NftMetadata>(nfts, chunkSize);

	let nftsVoteAccounts: { nft: NftMetadata, accountExists: boolean }[] = [];
	for (const chunk of chunks) {
		    const chunkResult = await Promise.all(
					chunk.map((nft) => checkVoteAccount(connection, proposal, nft))
				);
				nftsVoteAccounts = [...nftsVoteAccounts, ...chunkResult];
				await sleep(delayBetweenChunks); // Delay between chunks
	}

	return new Response(JSON.stringify(nftsVoteAccounts), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': `public, max-age=5` // 5 seconds
		}
	});
};
