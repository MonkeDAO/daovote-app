<script lang="ts">
	import {
		extractDescriptionSettingsData,
		extractOwnersSettingsData,
		extractRestrictionData,
		getExplorerUrl,
		trimAddress
	} from '$lib/utils/solana';
	import { goto } from '$app/navigation';
	import { PUBLIC_SOLANA_NETWORK } from '$env/static/public';
	import type { VotebankArgs } from '$lib/anchor/accounts';

	export let voteData: { voteBank: VotebankArgs; address: string };
	let voteBankInfo: {
		name: string;
		description: string;
		address: string;
	};
	let owners: string[] = [];
	let currentProposals = 0;
	let closedProposals = 0;
	let restriction: {
		restrictionType: 'nft' | 'token' | 'none';
		restrictionValue: {
			address: string;
			amount: number;
		};
	};
	$: if (voteData) {
		const descriptionInfo = extractDescriptionSettingsData(voteData.voteBank.settings);
		voteBankInfo = {
			name: descriptionInfo.title,
			description: descriptionInfo.description,
			address: voteData.address
		};
		owners = extractOwnersSettingsData(voteData.voteBank.settings);
		const restrictionSettings = extractRestrictionData(voteData.voteBank.settings);
		currentProposals = voteData.voteBank.openProposals?.length ?? 0;
		closedProposals = voteData.voteBank.closedProposals?.length ?? 0;
		restriction = {
			restrictionType: restrictionSettings.isNftRestricted
				? 'nft'
				: !restrictionSettings.isNftRestricted
				? 'token'
				: 'none',
			restrictionValue: {
				address: restrictionSettings.restrictionMint.toBase58(),
				//This BN conversion is not correct, its just the string version of the BN e.g. 64 = 100
				amount: restrictionSettings.restrictionAmount
			}
		};
	}
	async function createProposal() {
		// Your create proposal logic
		await goto(`/votebank/${voteData.address}/create`);
	}
	async function viewProposals() {
		await goto(`/votebank/${voteData.address}/proposals`);
	}
</script>

<div>
	{#if voteData}
		<!-- <div class="my-4 flex justify-center">
			<button class="btn-primary btn" on:click={createProposal}>Create a Proposal</button>
		</div> -->
		<div class="card-container">
			<div class="custom-card card bg-gray-200 shadow-xl dark:bg-gray-700">
				<div class="card-content card-body">
					<h2 class="card-title text-gray-900 dark:text-gray-100">{voteBankInfo.name}</h2>
					<h3 class="text-gray-900 dark:text-gray-100">{voteBankInfo.description}</h3>
					<div class="divider" />
					<p class="text-gray-900 dark:text-gray-100">
						Open Proposals:<span class="badge-success badge badge-lg ml-2">{currentProposals}</span>
					</p>
					<p class="text-gray-900 dark:text-gray-100">
						Closed Proposals:<span class="badge-error badge badge-lg ml-2">{closedProposals}</span>
					</p>
					<p class="text-gray-900 dark:text-gray-100">
						Address: <a
							href={getExplorerUrl(PUBLIC_SOLANA_NETWORK, 'address', voteBankInfo.address)}
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
										href={getExplorerUrl(
											PUBLIC_SOLANA_NETWORK,
											'address',
											restriction.restrictionValue.address
										)}
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
							class="bg-base-400 collapse-arrow rounded-box collapse border border-base-300"
						>
							<input type="checkbox" />
							<div class="collapse-title text-lg font-medium text-gray-900 dark:text-gray-100">
								Owners
							</div>
							<div class="collapse-content">
								<ul class="ml-2 list-disc">
									{#each owners as owner}
										<li class="text-gray-100 dark:text-gray-100">
											<a
												href={getExplorerUrl(PUBLIC_SOLANA_NETWORK, 'address', owner)}
												target="_blank">{trimAddress(owner)}</a
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
