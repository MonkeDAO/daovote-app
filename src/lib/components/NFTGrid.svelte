<!-- src/components/NftGrid.svelte -->
<script lang="ts">
	import { selectedNfts } from '$lib/selectedNfts';
	import type { NftMetadata } from '$lib/types';
	import { nftStore } from '$lib/stores/nftStore';
	import { filteredNftStore } from '$lib/stores/filteredNftStore';

	export let nfts: NftMetadata[] | undefined;
	let isFiltering: boolean;
	let loading = true;
	nftStore.subscribe((store) => {
		loading = store.isFetching;
		nfts = store.data;
	});
	filteredNftStore.subscribe((store) => {
		isFiltering = store.isFetching;
	});
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

{#if loading || isFiltering}
	<div class="mb-6 flex flex-col items-center justify-center">
		<div class="text-2xl font-bold leading-relaxed text-gray-900 dark:text-gray-100">
			Loading NFTs...
		</div>
		<span class="loading loading-infinity loading-lg text-info"></span>
	</div>
	<!--TODO: Add grouping / sorting by collection based on the proposal/votebank restriction-->
{:else if !loading && nfts}
	<h3 id="latest" class="text-2xl font-bold tracking-tight text-black dark:text-white md:text-2xl">
		Select NFTs for Voting (
		<div class="badge-outline badge badge-xs bg-gray-200" />
		<span class="text-sm">Not Voted&nbsp;</span>
		<div class="badge-success badge badge-xs" />
		<span class="text-sm">&nbsp;Voted</span>
		)
	</h3>
	<div class="mb-4 grid grid-cols-4 gap-4">
		{#each nfts as nft (nft.address)}
			{#if nft.json}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<div class="p-2">
					<div class="avatar {nft.eligible ? 'offline cursor-pointer' : 'online cursor-not-allowed'}">
						<div
							class="rounded-full {$selectedNfts.includes(nft)
								? 'ring ring-primary-focus ring-offset-2 ring-offset-base-100 dark:ring-offset-4'
								: ''}"
							on:click={() => (nft.eligible ? toggleNftSelection(nft) : console.log('ineligible'))}
						>
							<img
								class="mt-0 h-full w-full object-fill"
								src={nft.json.image ?? "https://arweave.net/ncRp795w-ca_Xb5zkUBtBmxSQ_bcYA49E03NtMoHJMg"}
								alt={nft.json.name}
							/>
						</div>
					</div>
					<p class="text-sm font-bold text-black dark:text-white">{nft.json.name}</p>
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
