<!-- src/components/NftGrid.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { selectedNfts } from '$lib/selectedNfts';

	export let nfts: any[];
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
	<div class="flex flex-col items-center justify-center mb-6">
		<div class="text-3xl font-bold leading-relaxed text-gray-900 dark:text-gray-100">
			Loading nfts...
		</div>
		<progress class="w-70 progress progress-primary" />
	</div>
{:else if !loading && nfts}
	<div class="mb-4 grid grid-cols-4 gap-4">
		{#each nfts as nft (nft.address)}
			{#if nft.json}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
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
					<p class="mt-2 text-sm">{nft.json.name}</p>
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
</style>
