<!-- src/components/NftGrid.svelte -->
<script lang="ts">
	import { selectedNfts } from '$lib/selectedNfts';
	import type { NftMetadata } from '$lib/types';
	import { nftStore } from '$lib/stores/nftStore';
	import { filteredNftStore } from '$lib/stores/filteredNftStore';
	import { onDestroy, onMount } from 'svelte';

	export let nfts: NftMetadata[] | undefined;
	let isFiltering: boolean;
	let loading = true;
	nftStore.subscribe((store) => {
		loading = store.isFetching;
		nfts = store.data;
	});
	filteredNftStore.subscribe((store) => {
		isFiltering = store.isFetching;
		if (store.ineligible && store.eligible) {
			nfts = [...store.eligible, ...store.ineligible];
		}
	});
	onMount(() => {
		selectedNfts.reset();
	});
	function toggleNftSelection(nft: any) {
		if (isSelected(nft)) {
			selectedNfts.remove(nft.address);
		} else {
			selectedNfts.add(nft);
		}
		console.log('selected nfts', $selectedNfts);
	}

	function selectAll() {
		if (nfts) {
			selectedNfts.selectAll(nfts.filter((nft) => nft.eligible));
		}
	}

	function deselectAll() {
		selectedNfts.reset();
	}

	function isSelected(nft: any) {
		return $selectedNfts.some((selected) => selected.address === nft?.address);
	}
	onDestroy(() => {
		filteredNftStore.clear();
	});

	let selectCount: number;
	let maxEligibleCount = 0;

	// Update maxEligibleCount whenever nfts changes
	$: {
		if (nfts) {
			maxEligibleCount = nfts.filter(nft => nft.eligible).length;
			// Initialize selectCount if not set or if it's greater than maxEligibleCount
			if (!selectCount || selectCount > maxEligibleCount) {
				selectCount = Math.min(10, maxEligibleCount);
			}
		}
	}

	function handleSelectCountInput(event: Event) {
		const input = event.target as HTMLInputElement;
		const value = parseInt(input.value);
		
		if (isNaN(value) || value < 1) {
			selectCount = 1;
		} else if (value > maxEligibleCount) {
			selectCount = maxEligibleCount;
		}
	}

	function selectN(count: number) {
		if (nfts) {
			const eligibleNfts = nfts.filter((nft) => nft.eligible);
			selectedNfts.selectAll(eligibleNfts.slice(0, count));
		}
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
{:else if !loading && !isFiltering && nfts}
	<h3 id="latest" class="text-2xl font-bold tracking-tight text-black dark:text-white md:text-2xl">
		Select NFTs for Voting (
		<div class="badge-outline badge badge-xs bg-gray-200" />
		<span class="text-sm">Not Voted&nbsp;</span>
		<div class="badge-success badge badge-xs" />
		<span class="text-sm">&nbsp;Voted</span>
		)
	</h3>
	<div class="mb-4 mt-2 flex flex-wrap gap-2">
		{#if nfts && nfts.some(x => x.eligible)}
			<button class="btn btn-info btn-sm join-item" on:click={selectAll}>Select All</button>
			<div class="join">
				<button 
					class="btn btn-info btn-sm join-item" 
					on:click={() => selectN(selectCount)}
					disabled={!selectCount || selectCount < 1}
				>
					Select {selectCount || 0}
				</button>
				<input
					type="number"
					class="input input-bordered input-sm join-item w-20"
					
					bind:value={selectCount}
					on:input={handleSelectCountInput}
					min="1"
					max={maxEligibleCount}
					placeholder={maxEligibleCount.toString()}
				/>
			</div>
		{/if}
		{#if $selectedNfts.length > 0}
			<button class="btn btn-warning btn-sm join-item" on:click={deselectAll}>Unselect All</button>
		{/if}
	</div>

	{#if $selectedNfts.length > 10}
		<div class="alert alert-warning mb-4">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
			</svg>
			<span>
				Selecting more than 10 NFTs might cause transaction issues. If this happens, please refresh and try again with fewer NFTs.
			</span>
		</div>
	{/if}

	<div class="mb-4 grid grid-cols-4 gap-4">
		{#each nfts as nft (nft.address)}
			{#if nft.json}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<div class="p-2">
					<div class="avatar {nft.eligible ? 'offline cursor-pointer' : 'online cursor-not-allowed'}">
						<div
							class="rounded-full {$selectedNfts.some(selected => selected?.address === nft?.address)
								? 'ring ring-primary-focus ring-offset-2 ring-offset-base-100 dark:ring-offset-4'
								: ''}"
							on:click={() => (nft.eligible ? toggleNftSelection(nft) : console.log('ineligibsle', nft))}
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
	:global(.avatar.online:before) {
        background-color: hsl(var(--p) / var(--tw-bg-opacity));
    }
	:global(.avatar.offline:before) {
        background-color: hsl(var(--n));
    }
</style>
