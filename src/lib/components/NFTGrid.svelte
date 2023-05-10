<!-- src/components/NftGrid.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { selectedNfts } from '$lib/selectedNfts';
	import type { NftMetadata } from '$lib/types';

	export let nfts: NftMetadata[] | undefined;
	let loading = true;
	onMount(() => {
		// Perform any additional actions when the component is mounted
	});
	$: if (nfts && nfts.length >= 0) {
		loading = false;
	}
	function toggleNftSelection(nft: any) {
		if (isSelected(nft)) {
			selectedNfts.remove(nft.address);
		} else {
			selectedNfts.add(nft);
		}
		console.log('selected nfts', $selectedNfts);
	}

	function isSelected(nft: any) {
		console.log('is selected', nft, $selectedNfts);
		return $selectedNfts.includes(nft);
	}
</script>

{#if loading}
	<div class="mb-6 flex flex-col items-center justify-center">
		<div class="text-3xl font-bold leading-relaxed text-gray-900 dark:text-gray-100">
			Loading nfts...
		</div>
		<progress class="w-70 progress progress-primary" />
	</div>
	<!--TODO: Add grouping / sorting by collection based on the proposal/votebank restriction-->
{:else if !loading && nfts}
	<div class="mb-4 grid grid-cols-4 gap-4">
		{#each nfts as nft (nft.address)}
			{#if nft.json}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<div class="tooltip tooltip-info" data-tip={nft.collection?.name}>
					<div
						class="cursor-pointer rounded border border-gray-300 p-2 hover:border-blue-500 {$selectedNfts.includes(
							nft
						)
							? 'selected'
							: ''}"
						on:click={() => toggleNftSelection(nft)}
					>
						<img
							src={nft.json.image}
							alt={nft.json.name}
							class="h-auto w-full rounded object-cover"
						/>
						<p class="text-sm">{nft.json.name}</p>
					</div>
				</div>
			{/if}
		{/each}
	</div>
{/if}

<style>
	/* Add any additional styles here */
	.selected {
		border-color: blue;
	}
	.grid-cols-4 {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		grid-gap: 1rem;
	}

	@media (max-width: 768px) {
		.grid-cols-4 {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
