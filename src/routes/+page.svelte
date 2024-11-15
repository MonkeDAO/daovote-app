<script lang="ts">
	import Newsletter from '$lib/components/Newsletter.svelte';
	import GeneralCard from '$lib/components/GeneralCard.svelte';
	import { PUBLIC_IGNORED_PROPOSALS } from '$env/static/public';
	import type { CardItem, ProposalItem } from '$lib/types';
	import { SITE_URL, SITE_TITLE, SITE_DESCRIPTION, MY_TWITTER_HANDLE } from '$lib/siteConfig';
	import { bnToDate } from '$lib/utils/solana';
	import ProposalCardSkeleton from '$lib/components/skeletons/ProposalCardSkeleton.svelte';
	import ProposalListItemSkeleton from '$lib/components/skeletons/ProposalListItemSkeleton.svelte';
	export let data: any;
	let ignoredProposalsArray = PUBLIC_IGNORED_PROPOSALS?.split(',') || [];

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

<svelte:head>
	<title>{SITE_TITLE}</title>
	<link rel="canonical" href={SITE_URL} />
	<meta property="og:url" content={SITE_URL} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={SITE_TITLE} />
	<meta name="Description" content={SITE_DESCRIPTION} />
	<meta property="og:description" content={SITE_DESCRIPTION} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:creator" content={'@' + MY_TWITTER_HANDLE} />
	<meta name="twitter:title" content={SITE_TITLE} />
	<meta name="twitter:description" content={SITE_DESCRIPTION} />
</svelte:head>

<div
	class="mx-auto flex max-w-2xl flex-col items-start justify-center border-base-300 px-4 pb-16 sm:px-8"
>
	<div class="flex flex-col-reverse items-start sm:flex-row">
		<div class="flex flex-col pr-8">
			<h1 class="mb-3 text-3xl font-bold tracking-tight text-base-content md:text-5xl">
				This is

				<span
					class="relative ml-2 inline-block before:absolute before:-inset-1 before:block before:-skew-y-3 before:bg-primary"
				>
					<span class="relative skew-y-3 text-primary-content">{SITE_TITLE}</span>
				</span>
				!
			</h1>
			<h2 class="mb-4 text-base-content/70">
				An on-chain voting solution built by <span class="font-semibold">MonkeDAO.</span> Made for
				<a class="link link-seconday hover:link-primary" href="https://monkedao.io">MonkeDAO</a>.
			</h2>
			<!-- <p class="mb-16 text-gray-600 dark:text-gray-400">
				<a href={REPO_URL}>View source and feature list here!</a>
			</p> -->
		</div>
		<!-- <div
				class="w-[80px] h-[80px] rounded-full sm:w-[176px] sm:h-[136px] relative mb-8 sm:mb-0 mr-auto bg-cyan-300 bg-opacity-25"
			/> -->
	</div>

	<section class="mb-16 w-full">
		<h3 class="mb-6 text-2xl font-bold tracking-tight text-base-content md:text-4xl">
			Open Proposals
		</h3>
		{#await data.streamed.openProposals}
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
				{#each Array(4) as _}
					<div class="flex justify-center">
						<ProposalCardSkeleton />
					</div>
				{/each}
			</div>
		{:then proposals}
			{#if proposals?.length > 0}
				<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
					{#each proposals
						//@ts-ignore
						.filter(p => !ignoredProposalsArray.includes(p.proposalId))
						//@ts-ignore
						.sort((a, b) => b.proposalId - a.proposalId) as item (item)}
						<div class="flex justify-center">
							<GeneralCard item={mapItemToCardItem(item)} />
						</div>
					{/each}
				</div>
			{:else}
				<div class="flex items-center justify-center">
					<p class="text-base-content/60">No open proposals</p>
				</div>
			{/if}
		{/await}
	</section>
	<section class="mb-8 w-full">
		<h3
			id="latest"
			class="mb-6 text-2xl font-bold tracking-tight text-base-content md:text-4xl"
		>
			Closed Proposals
		</h3>
		{#await data.streamed.closedProposals}
			<ul class="space-y-3">
				{#each Array(5) as _}
					<ProposalListItemSkeleton />
				{/each}
			</ul>
		{:then proposals}
			<ul class="space-y-2">
				{#each proposals as item (item)}
					<li>
						<a
							class="link dark:link-secondary-light link-secondary hover:link-primary font-bold"
							data-sveltekit-preload-data
							 href="/votebank/{item.votebank}/proposal/{item.proposalId}"
						>
							{item.data.title}
						</a>
						<span class="hidden text-xs text-base-content/70 sm:inline">
							{item.endTime ? bnToDate(item.endTime)?.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}
						</span>
					</li>
				{/each}
			</ul>
		{/await}
	</section>
</div>
