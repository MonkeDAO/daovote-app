<script lang="ts">
	import GeneralCard from '$lib/components/GeneralCard.svelte';
	import type { CardItem, ProposalItem } from '$lib/types';
	import 'prism-themes/themes/prism-shades-of-purple.min.css';
	import { SITE_TITLE } from '$lib/siteConfig';
	export let data: any;
	let open_proposals: ProposalItem[] = [];
	let closed_proposals: ProposalItem[] = [];
	let loading = true;
	let currentTab = 'open';
	$: if (data) {
		open_proposals = data.json.open_proposals;
		closed_proposals = data.json.closed_proposals;
		loading = false;
	}
	function mapItemToCardItem(item: ProposalItem): CardItem {
		return {
			title: item.data.title,
			description: item.data.summary,
			url: `/votebank/${item.votebank}/proposal/${item.proposalId}`,
			endtime: item.endTime,
			quorumThreshold: item.quorumThreshold,
			quorumMetTime: item.quorumMetTime,
			voterCount: item.voterCount
		};
	}
</script>

<!-- ... -->

<div class="container mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
	<div class="flex flex-col-reverse items-start sm:flex-row">
		<div class="flex flex-col pr-8">
			<h1 class="mb-3 text-3xl font-bold tracking-tight text-secondary-dark dark:text-accent-light md:text-5xl">
				This is
				<span class="text-brand dark:text-accent">{SITE_TITLE}</span>
			</h1>
			<h2 class="mb-4 text-gray-700 dark:text-gray-200">
				An on-chain voting solution built by <span class="font-semibold">Degens.</span> Made for
				<a class="text-green-800 dark:text-yellow-50" href="https://monkedao.io">MonkeDAO</a>.
			</h2>
			<!-- <p class="mb-16 text-gray-600 dark:text-gray-400">
				<a href={REPO_URL}>View source and feature list here!</a>
			</p> -->
			<div class="mb-4 flex space-x-4">
				<button
					class="rounded-lg px-4 py-2 text-secondary-dark dark:text-accent-light"
					class:bg-brand-light={currentTab === 'open'}
					class:dark:bg-secondary-dark={currentTab === 'open'}
					on:click={() => (currentTab = 'open')}
				>
					Open Proposals
				</button>
				<button
					class="rounded-lg px-4 py-2 text-secondary-dark dark:text-accent-light"
					class:bg-brand-light={currentTab === 'closed'}
					class:dark:bg-secondary-dark={currentTab === 'closed'}
					on:click={() => (currentTab = 'closed')}
				>
					Closed Proposals
				</button>
			</div>
		</div>
		<!-- <div
				class="w-[80px] h-[80px] rounded-full sm:w-[176px] sm:h-[136px] relative mb-8 sm:mb-0 mr-auto bg-cyan-300 bg-opacity-25"
			/> -->
	</div>
	<h3
		class="mb-6 text-center text-2xl font-bold tracking-tight text-black dark:text-white md:text-4xl"
	>
		Proposals
	</h3>
	<section class="mb-16 w-full">
		{#if currentTab === 'open'}
			{#if loading}
				<div class="flex items-center justify-center">
					<progress class="progress w-56" />
				</div>
			{:else if open_proposals.length > 0}
				<div
					class="grid w-full grid-cols-1 place-items-center gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
				>
					{#each open_proposals as item (item)}
						<GeneralCard item={mapItemToCardItem(item)} />
					{/each}
				</div>
			{:else}
				<div class="flex items-center justify-center">
					<p class="text-gray-500">No open proposals</p>
				</div>
			{/if}
		{:else if loading}
			<div class="flex items-center justify-center">
				<div class="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-gray-900" />
			</div>
		{:else if closed_proposals.length > 0}
			<div class="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each closed_proposals as item (item)}
					<GeneralCard item={mapItemToCardItem(item)} />
				{/each}
			</div>
		{:else}
			<div class="flex items-center justify-center">
				<p class="text-gray-500">No closed proposals</p>
			</div>
		{/if}
	</section>
</div>
