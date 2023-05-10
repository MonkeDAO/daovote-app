<!-- src/components/NftGrid.svelte -->
<script lang="ts">
	import { selectedNfts } from '$lib/selectedNfts';
	import { nftStoreUser } from '$lib/stores/nftStoreUser';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	const nftSyncing = nftStoreUser(walletStore);
	import type { NftMetadata } from '$lib/types';

	export let nfts: NftMetadata[] | undefined;
	let loading = true;
	$: if (nfts && nfts.length >= 0 && $nftSyncing.isCurrentWallet) {
		loading = false;
		console.log("holy", nfts);
	}
	$: if (!$nftSyncing.isCurrentWallet) {
		loading = true;
	} else {
		setTimeout(() => {
			loading = false;
		}, 1500);
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
				<div
					class="cursor-pointer p-2"
				>
					<div class="avatar {nft.eligible
						? 'online'
						: 'offline'}">
						<div class="rounded-full {$selectedNfts.includes(
							nft
						)
							? 'ring ring-primary-focus ring-offset-base-100 ring-offset-2'
							: ''}"
						on:click={() => toggleNftSelection(nft)}>
							<img
								class="mt-0 h-full w-full object-fill"
								src={nft.json.image}
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
