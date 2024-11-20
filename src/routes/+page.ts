import { web3 } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { Votebank } from '$lib/anchor/accounts';
import { fetchProposals, getEnvNetwork } from '$lib/utils/solana';
import { PUBLIC_VOTEBANK } from '$env/static/public';
import { getCachedData, setCachedData } from '$lib/utils/cache';
// export const prerender = true; // turned off bc it causes errors

export async function load() {
    // Return a promise immediately for basic data structure
    return {
        streamed: {
            openProposals: getOpenProposals(),
            closedProposals: getClosedProposals()
        },
        address: PUBLIC_VOTEBANK
    };
}

async function getOpenProposals() {
    const cacheKey = `openProposals-${PUBLIC_VOTEBANK}`;
    try {
        const cached = getCachedData(cacheKey);
        if (cached) return cached;

        const connection = getEnvNetwork();
        const data = await Votebank.fromAccountAddress(connection, new web3.PublicKey(PUBLIC_VOTEBANK));
        
        if (!data.openProposals) return [];
        
        const proposals = await fetchProposals(
            connection,
            new PublicKey(PUBLIC_VOTEBANK),
            data.openProposals
        );
        
        if (proposals && proposals.length > 0) {
            setCachedData(cacheKey, proposals);
        }
        
        return proposals || [];
    } catch (error) {
        console.error('Error fetching open proposals:', error);
        return [];
    }
}

async function getClosedProposals() {
    const connection = getEnvNetwork();
    const data = await Votebank.fromAccountAddress(connection, new web3.PublicKey(PUBLIC_VOTEBANK));
    if (data.closedProposals && data.closedProposals.length > 0) {
        const proposals = await fetchProposals(
            connection,
            new PublicKey(PUBLIC_VOTEBANK),
            data.closedProposals
        );
        return proposals.sort((a, b) => b.endTime - a.endTime);
    }
    return [];
}

