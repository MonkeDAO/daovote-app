import { web3 } from '@coral-xyz/anchor';
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
        const connection = getEnvNetwork();
        const data = await Votebank.fromAccountAddress(connection, new web3.PublicKey(PUBLIC_VOTEBANK));
        
        if (!data.openProposals) return [];
        
        const expectedCount = data.openProposals.length;
        const cached = getCachedData(cacheKey);
        
        // Only use cache if it contains the expected number of proposals
        if (cached && cached.length === expectedCount) {
            return cached;
        }

        const proposals = await fetchProposals(
            connection,
            new PublicKey(PUBLIC_VOTEBANK),
            data.openProposals
        );
        
        if (proposals?.length !== expectedCount) {
            console.warn(`Received ${proposals?.length ?? 0} proposals but expected ${expectedCount}`);
        }
        
        if (proposals && proposals.length === expectedCount) {
            setCachedData(cacheKey, proposals);
        }
        
        return proposals || [];
    } catch (error) {
        console.error('Error fetching open proposals:', error);
        return [];
    }
}

async function getClosedProposals() {
    const cacheKey = `closedProposals-${PUBLIC_VOTEBANK}`;
    try {
        const connection = getEnvNetwork();
        const data = await Votebank.fromAccountAddress(connection, new web3.PublicKey(PUBLIC_VOTEBANK));
        
        if (!data.closedProposals) return [];
        
        const expectedCount = data.closedProposals.length;
        const cached = getCachedData(cacheKey);
        
        // Only use cache if it contains the expected number of proposals
        if (cached && cached.length === expectedCount) {
            return cached.sort((a: any, b: any) => b.endTime - a.endTime);
        }

        const proposals = await fetchProposals(
            connection,
            new PublicKey(PUBLIC_VOTEBANK),
            data.closedProposals
        );
        
        if (proposals?.length !== expectedCount) {
            console.warn(`Received ${proposals?.length ?? 0} closed proposals but expected ${expectedCount}`);
        }
        
        const sortedProposals = proposals?.sort((a, b) => b.endTime - a.endTime) || [];
        
        if (proposals && proposals.length === expectedCount) {
            setCachedData(cacheKey, sortedProposals);
        }
        
        return sortedProposals;
    } catch (error) {
        console.error('Error fetching closed proposals:', error);
        return [];
    }
}

