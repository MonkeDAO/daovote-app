<script lang="ts">
    import type { BN } from '@project-serum/anchor';
    import CountDownCard from '../CountDownCard.svelte';
    import { isQuorumMet, getProposalEndTime } from '$lib/utils/proposal';
    
    export let proposal: {
        quorumThreshold: number;
        quorumMetTime: BN;
        voterCount: number;
        endTime: BN;
    };
    
    $: quorumMet = isQuorumMet(proposal);
    $: endTime = getProposalEndTime(proposal);
    $: quorumPercentage = proposal.quorumThreshold > 0 
        ? (proposal.voterCount / proposal.quorumThreshold) * 100 
        : 0;
    export let compact = false;
</script>

{#if proposal.quorumThreshold > 0}
    <div class="flex flex-col" class:gap-1={compact} class:gap-3={!compact}>
        <div class="flex justify-between text-secondary-dark dark:text-accent-light" 
             class:text-xs={compact} 
             class:text-base={!compact}
             class:py-1={!compact}>
            <span>Quorum Progress {proposal.voterCount}/{proposal.quorumThreshold}</span>
            {#if !compact}
                <span class="text-secondary dark:text-accent ml-4">
                    {Math.min(Math.round((proposal.voterCount / proposal.quorumThreshold) * 100), 100)}%
                </span>
            {/if}
        </div>
        <div class="w-full bg-brand-light rounded-full dark:bg-secondary-dark"
             class:h-1.5={compact}
             class:h-2.5={!compact}>
            <div 
                class="bg-brand dark:bg-accent rounded-full transition-all duration-500" 
                class:h-1.5={compact}
                class:h-2.5={!compact}
                style="width: {Math.min(quorumPercentage, 100)}%"
            />
        </div>
        {#if quorumMet}
            <div class:mt-1={compact} class:mt-3={!compact}>
                <span class="text-secondary dark:text-accent" class:text-xs={compact} class:text-sm={!compact}>
                    Quorum met! Proposal closes in:
                </span>
                <CountDownCard targetDate={endTime} displayLabel={false} />
            </div>
        {/if}
    </div>
{:else}
    <CountDownCard targetDate={endTime} displayLabel={!compact} />
{/if}