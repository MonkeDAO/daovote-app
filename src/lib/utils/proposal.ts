import type { BN } from '@project-serum/anchor';
import { bnToDate } from './solana';

export function isProposalClosed(proposal: {
    quorumThreshold: number;
    quorumMetTime: BN;
    voterCount: number;
    endTime: BN;
}): boolean {
    const currentTime = Math.floor(Date.now() / 1000); // Current unix timestamp in seconds
    
    // If quorum is met and threshold exists, check if 7 days have passed
    if (isQuorumMet(proposal) && !proposal.quorumMetTime.isZero() && proposal.quorumThreshold > 0) {
        const quorumMetTime = proposal.quorumMetTime.toNumber();
        return currentTime > quorumMetTime + (7 * 24 * 60 * 60);
    }
    
    // Fallback to end_time if set
    if (!proposal.endTime.isZero()) {
        const endTime = proposal.endTime.toNumber();
        return currentTime > endTime;
    }
    
    return false;
}

export function isQuorumMet(proposal: { quorumThreshold: number; voterCount: number }): boolean {
    return proposal.voterCount >= proposal.quorumThreshold;
}

export function getProposalEndTime(proposal: {
    quorumThreshold: number;
    quorumMetTime: BN;
    endTime: BN;
}): Date {
    if (proposal.quorumThreshold > 0 && !proposal.quorumMetTime.isZero()) {
        const quorumMetTime = proposal.quorumMetTime.toNumber();
        return new Date((quorumMetTime + (7 * 24 * 60 * 60)) * 1000);
    }
    return bnToDate(proposal.endTime);
}