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
	$: quorumPercentage =
		proposal.quorumThreshold > 0 ? (proposal.voterCount / proposal.quorumThreshold) * 100 : 0;
	export let compact = false;
</script>

{#if proposal.quorumThreshold > 0}
	<div class="flex flex-col" class:gap-1={compact} class:gap-3={!compact}>
		<div
			class="flex justify-between text-accent-content dark:text-accent"
			class:text-xs={compact}
			class:text-base={!compact}
			class:py-1={!compact}
		>
			<span>Quorum Progress {proposal.voterCount}/{proposal.quorumThreshold}</span>
			{#if quorumMet}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="ml-1.5 text-success"
					class:w-4={compact}
					class:h-4={compact}
					class:w-5={!compact}
					class:h-5={!compact}
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			{/if}
			{#if !compact}
				<span class="ml-4 text-neutral">
					{Math.min(Math.round((proposal.voterCount / proposal.quorumThreshold) * 100), 100)}%
				</span>
			{/if}
		</div>
		<div class="w-full rounded-full bg-accent/70" class:h-1.5={compact} class:h-2.5={!compact}>
			<div
				class="rounded-full bg-secondary transition-all duration-500"
				class:h-1.5={compact}
				class:h-2.5={!compact}
				style="width: {Math.min(quorumPercentage, 100)}%"
			/>
		</div>
		{#if quorumMet}
			<div class:mt-1={compact} class:mt-3={!compact}>
				<span class="text-base-content/80" class:text-xs={compact} class:text-sm={!compact}>
					Quorum met! Proposal closes in:
				</span>
				<CountDownCard targetDate={endTime} displayLabel={false} />
			</div>
		{/if}
	</div>
{:else}
	<CountDownCard targetDate={endTime} displayLabel={!compact} />
{/if}
