<script lang="ts">
	import { getExplorerUrl, trimAddress } from '$lib/utils/solana';
	import type { VoteBank } from '$lib/anchor/omcvote/types';
	import * as anchor from '@project-serum/anchor';
	import type { VoteBankProposals } from '$lib/types';
	import { goto } from '$app/navigation';

	export let voteData: { voteBank: VoteBank; address: string };
	let voteBankInfo: {
		name: string;
		description: string;
		address: string;
	};
	let owners: string[] = [];
	let currentProposals = 0;
	let restriction: {
		restrictionType: 'nft' | 'token' | 'none';
		restrictionValue: {
			address: string;
			amount: number;
		};
	};
	$: if (voteData) {
		voteBankInfo = {
			name: voteData.voteBank.settings?.find((x) => x.description)?.description?.title || '',
			description: voteData.voteBank.settings?.find((x) => x.description)?.description?.desc || '',
			address: voteData.address
		};
		owners = voteData.voteBank.settings?.find((x) => x.ownerInfo)?.ownerInfo?.owners || [];
		currentProposals = voteData.voteBank.openProposals?.length ?? 0;
		restriction = {
			restrictionType: voteData.voteBank.settings?.find((x) => x.voteRestriction)?.voteRestriction
				?.voteRestriction?.tokenOwnership
				? 'token'
				: voteData.voteBank.settings?.find((x) => x.voteRestriction)?.voteRestriction
						?.voteRestriction?.nftOwnership
				? 'nft'
				: 'none',
			restrictionValue: {
				address:
					voteData.voteBank.settings?.find((x) => x.voteRestriction)?.voteRestriction
						?.voteRestriction?.tokenOwnership?.mint ||
					voteData.voteBank.settings?.find((x) => x.voteRestriction)?.voteRestriction
						?.voteRestriction?.nftOwnership?.collectionId ||
					'',
				//This BN conversion is not correct, its just the string version of the BN e.g. 64 = 100
				amount: voteData.voteBank.settings?.find((x) => x.voteRestriction)?.voteRestriction
					?.voteRestriction?.tokenOwnership?.amount
					? new anchor.BN(
							voteData.voteBank.settings?.find(
								(x) => x.voteRestriction
							)?.voteRestriction?.voteRestriction?.tokenOwnership?.amount
					  ).toNumber()
					: 1
			}
		};
	}
	async function viewProposals() {
		await goto(`/votebank/${voteData.address}/proposals`);
  	}
</script>

<div>
	{#if voteData}
		<div class="card-container">
			<div class="custom-card card bg-gray-200 dark:bg-gray-700 shadow-xl">
				<div class="card-content card-body">
					<h2 class="card-title text-gray-900 dark:text-gray-100">{voteBankInfo.name}</h2>
					<h3 class="text-gray-900 dark:text-gray-100">{voteBankInfo.description}</h3>
					<div class="divider" />
					<p class="text-gray-900 dark:text-gray-100">
						Proposals:<span class="badge badge-lg ml-2">{currentProposals}</span>
					</p>
					<p class="text-gray-900 dark:text-gray-100">
						Address: <a
							href={getExplorerUrl('devnet', 'address', voteBankInfo.address)}
							target="_blank">{trimAddress(voteBankInfo.address)}</a
						>
					</p>

					{#if restriction.restrictionType == 'none'}
						<div />
					{:else}
						<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
						<div
							tabindex="0"
							class="bg-base-400 collapse-arrow rounded-box collapse border border-base-300"
						>
							<input type="checkbox" />
							<div class="collapse-title text-lg font-medium text-gray-900 dark:text-gray-100">
								Gated
							</div>
							<div class="collapse-content">
								<p class="text-gray-900 dark:text-gray-100">
									Gate type: {restriction.restrictionType}
								</p>
								<p class="text-gray-900 dark:text-gray-100">
									Gate value: <a
										href={getExplorerUrl('devnet', 'address', restriction.restrictionValue.address)}
										target="_blank">{trimAddress(restriction.restrictionValue.address)}</a
									>
								</p>
								<p class="text-gray-900 dark:text-gray-100">
									Gate amount: {restriction.restrictionValue.amount}
								</p>
							</div>
						</div>
					{/if}
					{#if owners.length == 0}
						<div />
					{:else}
						<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
						<div
							tabindex="0"
							class="collapse-arrow bg-base-400 rounded-box collapse border border-base-300"
						>
							<input type="checkbox" />
							<div class="collapse-title text-lg font-medium text-gray-900 dark:text-gray-100">
								Owners
							</div>
							<div class="collapse-content">
								<ul class="ml-2 list-disc">
									{#each owners as owner}
										<li class="text-gray-100 dark:text-gray-100">
											<a href={getExplorerUrl('devnet', 'address', owner)} target="_blank"
												>{trimAddress(owner)}</a
											>
										</li>
									{/each}
								</ul>
							</div>
						</div>
					{/if}
					<div class="card-actions justify-end">
						<button class="btn-primary btn" on:click={viewProposals}>View proposals</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.card-container {
		display: flex;
		justify-content: center;
	}
	.custom-card {
		min-width: 24rem; /* Minimum width, e.g. 256px */
		max-width: 80%; /* Maximum width as a percentage of the container */
		width: auto; /* Width adjusts automatically based on content */
	}
	.card-content {
		overflow-wrap: break-word;
	}
</style>
