<script lang="ts">
	import type { Connection } from '@solana/web3.js';
	import CollapsablePanelButton from '$lib/components/CollapsablePanelButton.svelte';
	import VoteConfirmationModal from '$lib/components//Vote/Voting/VoteConfirmationModal.svelte';
	import PdfViewer from '$lib/components/PDFViewer.svelte';
	import { createEventDispatcher, onDestroy } from 'svelte';
	import { toast } from '@zerodevx/svelte-toast';
	import type { NftMetadata, ProposalItem } from '$lib/types';
	import { bnToDate, extractRestrictionData } from '$lib/utils/solana';
	import { getRemainingTime, isDefaultDate } from '$lib/utils/date';
	import { workSpace } from '@svelte-on-solana/wallet-adapter-anchor';
	import CountDownCard from '../CountDownCard.svelte';
	import ConfirmationModal from '../ConfirmationModal.svelte';
	import NftGrid from '../NFTGrid.svelte';
	import { selectedNfts } from '$lib/selectedNfts';
	import type { SettingsData, VoteOption } from '$lib/anchor/types';
	import { filteredNftStore } from '$lib/stores/filteredNftStore';
	import { ownerCheckStore, ownerCheckSyncStore } from '$lib/stores/ownerStore';
	import LoadingOverlay from '../LoadingOverlay.svelte';
	import { Bar } from 'svelte-chartjs';
	import { Chart, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
	import { onMount } from 'svelte';

	let isMobile = false;
	onMount(() => {
		if (typeof window !== 'undefined') {
			isMobile = window.matchMedia('(max-width: 768px)').matches;
		}
	});

	let data = {
		labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
		datasets: [
			{
				label: '% of Votes',
				data: [12, 19, 3, 5, 2, 3],
				backgroundColor: [
					'rgba(255, 134,159,0.4)',
					'rgba(98,  182, 239,0.4)',
					'rgba(255, 218, 128,0.4)',
					'rgba(113, 205, 205,0.4)',
					'rgba(170, 128, 252,0.4)',
					'rgba(255, 177, 101,0.4)'
				],
				borderWidth: 2,
				borderColor: [
					'rgba(255, 134, 159, 1)',
					'rgba(98,  182, 239, 1)',
					'rgba(255, 218, 128, 1)',
					'rgba(113, 205, 205, 1)',
					'rgba(170, 128, 252, 1)',
					'rgba(255, 177, 101, 1)'
				]
			}
		]
	};

	Chart.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);
	export let proposalData: {
		proposal: ProposalItem;
		nfts?: NftMetadata[];
		votebankSettings?: SettingsData[];
	};
	let proposal: ProposalItem;
	let nfts: NftMetadata[] | undefined;
	let votebankSettings: SettingsData[] | undefined;
	let showPdf = false;
	let ended = false;
	let showImg = false;
	let notSupported = false;
	let options: any[];
	let voteConfirmationModal: any;
	let confirmationModal: any;
	let eligibleNfts: NftMetadata[] | undefined;
	let ineligibleNfts: NftMetadata[] | undefined;
	let allNfts: NftMetadata[] | undefined;
	let connection: Connection;
	let isOwner: boolean;
	let isNftRestricted: boolean;

	let modalOpen = false;
	$: {
		isOwner = $ownerCheckStore.isOwner;
		$ownerCheckSyncStore;
	}
	const dispatch = createEventDispatcher();
	console.log('proposal view', proposalData.proposal, proposalData.nfts);

	$: proposal = proposalData.proposal;
	$: nfts = proposalData.nfts;
	$: votebankSettings = proposalData.votebankSettings;
	$: if ($workSpace?.provider?.connection) {
		connection = $workSpace?.provider?.connection;
	}
	$: {
		if (proposal) {
			data = {
				labels: proposal.options.sort((a, b) => b.id - a.id).map((option) => option.title),
				datasets: [
					{
						label: '# of Votes',
						data: proposal.options
							.sort((a, b) => b.id - a.id)
							.map((option) => (option.voteCount ? option.voteCount : 0)),
						backgroundColor: [
							'rgba(255, 134,159,0.4)',
							'rgba(98,  182, 239,0.4)',
							'rgba(255, 218, 128,0.4)',
							'rgba(113, 205, 205,0.4)',
							'rgba(170, 128, 252,0.4)',
							'rgba(255, 177, 101,0.4)'
						],
						borderWidth: 2,
						borderColor: [
							'rgba(255, 134, 159, 1)',
							'rgba(98,  182, 239, 1)',
							'rgba(255, 218, 128, 1)',
							'rgba(113, 205, 205, 1)',
							'rgba(170, 128, 252, 1)',
							'rgba(255, 177, 101, 1)'
						]
					}
				]
			};
		}
	}

	filteredNftStore.subscribe(($filteredNftStore) => {
		eligibleNfts = $filteredNftStore.eligible;
		ineligibleNfts = $filteredNftStore.ineligible;
		allNfts = eligibleNfts?.concat(ineligibleNfts!).map((nft) => {
			let eligible = false;
			if (eligibleNfts?.includes(nft)) {
				eligible = true;
			}
			return { ...nft, eligible };
		});
	});

	$: {
		if (nfts && votebankSettings && connection && proposal) {
			const voteBankSetting = extractRestrictionData(votebankSettings);
			if (voteBankSetting.isNftRestricted && voteBankSetting.restrictionMint) {
				isNftRestricted = true;
				filteredNftStore.filterNfts(connection, proposal, votebankSettings, nfts);
			}
		}
	}
	onDestroy(() => {
		filteredNftStore.clear();
	});
	// async function checkVoteAccount(nft: NftMetadata) {
	// 	const accountExists = await voteAccountPdaExists(
	// 		connection,
	// 		new PublicKey(proposal.votebank),
	// 		new PublicKey(nft.address),
	// 		proposal.proposalId
	// 	);
	// 	return { nft, accountExists };
	// }
	// async function fetchAccountIfExists(filteredNfts: NftMetadata[]) {
	// 	if (connection && proposal) {
	// 		const nftsVoteAccounts = await Promise.all(filteredNfts.map(checkVoteAccount));
	// 		nftsFiltered = nftsVoteAccounts
	// 			.filter(({ accountExists }) => !accountExists)
	// 			.map(({ nft }) => nft);
	// 		ineligibleNfts = nftsVoteAccounts
	// 			.filter(({ accountExists }) => accountExists)
	// 			.map(({ nft }) => nft);
	// 		console.log('nftsFiltered', nftsFiltered, ineligibleNfts);
	// 	}
	// }

	if (proposalData.proposal?.data?.url?.endsWith('.pdf')) {
		showPdf = true;
	} else if (
		proposalData.proposal?.data?.url.endsWith('.png') ||
		proposalData.proposal?.data?.url.endsWith('.jpg') ||
		proposalData.proposal?.data?.url.endsWith('.jpeg')
	) {
		showImg = true;
	} else {
		notSupported = true;
	}
	if (proposalData.proposal?.options) {
		options = proposalData.proposal.options.map((option: any) => {
			return {
				id: option.id,
				title: option.title,
				checked: false
			};
		});
		if (
			proposalData.proposal?.endTime &&
			!isDefaultDate(bnToDate(proposalData.proposal.endTime)) &&
			proposalData.proposal?.voteOpen
		) {
			const endTime = bnToDate(proposalData.proposal.endTime);
			const remainingTime = getRemainingTime(endTime);
			if (remainingTime.ended) {
				ended = true;
			}
		}
	}
	if (!proposalData.proposal.voteOpen) {
		ended = true;
	}

	function getDate(timestamp: number) {
		return new Date(timestamp * 1000).toLocaleString();
	}

	function handleVote() {
		const checkedOptions = options.filter((option) => option.checked);
		if (checkedOptions.length >= 1 && checkedOptions.length <= proposal.maxOptionsSelectable) {
			//check nfts before opening the modal
			if (isNftRestricted && $selectedNfts.length === 0) {
				toast.push('You must select at least one NFT', {
					duration: 3000
				});
			} else {
				voteConfirmationModal.openModal();
			}
		} else if (checkedOptions.length > proposal.maxOptionsSelectable) {
			toast.push(`You can only select ${proposal.maxOptionsSelectable} options`, {
				duration: 3000
			});
		} else {
			toast.push('You must select at least one option', {
				duration: 3000
			});
		}
	}

	function handleVoteConfirmed(event: any) {
		const dispatchedOptions = event.detail;
		console.log('selectedOptions', dispatchedOptions);
		voteConfirmationModal.closeModal();
		dispatch('vote', { chosenOptions: dispatchedOptions, selectedNfts: $selectedNfts });

		options = options.map((option: any) => {
			return {
				...option,
				checked: false
			};
		});
		selectedNfts.reset();
	}

	function findWinningVoteOptions(voteOptions: any) {
		let winningOptionTitles = [];
		let maxVotes = 0;

		for (let i = 0; i < voteOptions.length; i++) {
			const option = voteOptions[i];
			if (option.voteCount > maxVotes) {
				maxVotes = option.voteCount;
				winningOptionTitles = [option.title];
			} else if (option.voteCount === maxVotes) {
				winningOptionTitles.push(option.title);
			}
		}

		return winningOptionTitles;
	}

	function closeProposal() {
		confirmationModal.openModal();
	}
	function handleCloseProposal(e: CustomEvent<any>): void {
		confirmationModal.closeModal();
		dispatch('closeProposal', e.detail);
	}
	onDestroy(() => {
		selectedNfts.reset();
	});
</script>

<VoteConfirmationModal
	bind:this={voteConfirmationModal}
	{options}
	on:voteConfirmed={handleVoteConfirmed}
/>
<ConfirmationModal
	data={proposal}
	bind:this={confirmationModal}
	message="Are you sure you want to close this proposal?"
	eventOnConfirm="closeProposal"
	on:closeProposal={handleCloseProposal}
/>
<LoadingOverlay />
<article
	class="votecontent prose mx-auto mb-5 mt-16 w-full max-w-none items-start justify-center dark:prose-invert"
>
	<h1
		class="mb-8 text-3xl font-bold tracking-tight text-black dark:text-white md:text-center md:text-5xl"
	>
		{proposal.data.title}
	</h1>
	<h3 class="tracking-tight text-gray-500 dark:text-white">
		Proposal ID {proposal.proposalId}: {proposal.data.summary}
	</h3>
	<div class="bg border-red mt-2 flex w-full sm:items-start md:flex-row md:items-center">
		<div class="flex w-full items-start justify-between">
			<div class="flex flex-col items-start text-sm text-gray-700 dark:text-gray-300">
				{#if ended}
					<div>Created On: {new Date(proposal?.data?.time * 1000).toLocaleDateString()}</div>
				{:else}
					<CountDownCard targetDate={bnToDate(proposal.endTime)} displayLabel={true} />
				{/if}
			</div>
			<div class="flex items-start text-sm text-gray-600 dark:text-gray-400">
				Status:
				{#if proposal.voteOpen}
					<div class="badge-success badge ml-1">Open</div>
				{:else}
					<div class="badge-error badge ml-1">Closed</div>
				{/if}
			</div>
		</div>
	</div>
	<div
		class="-mx-4 my-2 flex h-1 w-[100vw] bg-gradient-to-r from-purple-400 via-blue-500 to-green-200 sm:mx-0 sm:w-full"
	/>
	<!-- {#if !isDefaultDate(bnToDate(proposal.endTime))}
		<div class="mt-2">
			<CountDownCard targetDate={bnToDate(proposal.endTime)} />
		</div>
	{/if} -->
</article>
<div class="">
	{#if showPdf}
		<div class="mt-4">
			<CollapsablePanelButton title="View PDF">
				<PdfViewer pdfUrl={proposal.data.url} />
			</CollapsablePanelButton>
		</div>
	{:else if showImg}
		<div class="mt-4">
			<CollapsablePanelButton title="View Image">
				<!-- svelte-ignore a11y-img-redundant-alt -->
				<img src={proposal.data.url} alt="Proposal image" />
			</CollapsablePanelButton>
		</div>
	{:else if notSupported && proposal.data.url !== ''}
		<div class="mt-4">
			<h3 class="text-red-500">
				File not supported for viewer. <a href={proposal.data.url} target="_blank"
					>Click here to view</a
				>
			</h3>
		</div>
	{/if}
</div>
{#if !ended}
	<article
		class="votecontent prose mx-auto mb-32 mt-4 w-full max-w-none items-start justify-center dark:prose-invert"
	>
		<div
			class="my-4 w-full border-y border-blue-200 bg-blue-50 p-6 dark:border-gray-600 dark:bg-gray-800 sm:rounded sm:border-x"
		>
			<div class="flex items-center justify-between space-x-4 text-gray-900 dark:text-gray-100">
				<p class="text-lg font-bold md:text-xl">Vote</p>
				<p class="mx-0 my-0 text-sm text-gray-800 dark:text-gray-200">
					Number of votes cast is <span class="font-bold">{proposal.voterCount}</span>
				</p>
			</div>
			<p class="text-sm text-gray-800 dark:text-gray-200">
				You can vote for a maximum of {proposal.maxOptionsSelectable} out of {proposal.options
					.length}
			</p>
			<div class="list">
				{#each options as option (option)}
					<!-- <div class="mx-8 list-item text-gray-900 dark:text-gray-100">
					<div>
						<span class="list-item-title">{option.title}</span>
					</div>
				</div> -->
					<div class="form-control">
						<label class="label cursor-pointer">
							<span class="label-text text-black dark:text-gray-200">{option.title}</span>
							<input
								type="checkbox"
								bind:checked={option.checked}
								class="checkbox-primary checkbox"
							/>
						</label>
					</div>
				{/each}
			</div>
			<button
				class="btn-primary btn right-1 top-1 mt-5 flex h-8 w-28 items-center justify-center justify-center rounded bg-gray-100 px-4 pt-1 font-medium text-gray-900 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-100"
				on:click={handleVote}
				disabled={ended}
				>Vote
			</button>
		</div>
		<NftGrid nfts={allNfts} />
		{#if isOwner && proposal.voteOpen}
			<div
				class="relative m-px overflow-hidden rounded-md bg-slate-800 px-2 py-2 text-lg dark:bg-gray-300"
			>
				<div
					class="absolute -left-[15px] -top-[50px] z-0 h-[140px] w-[140px] rounded-full border bg-gradient-to-r from-purple-400 via-blue-500 to-green-200 blur-[60px] transition-all dark:blur-[80px]"
				/>
				<div class="relative z-10 text-center">
					<p class="text-sm text-gray-300 dark:text-black">
						<strong class="text-white dark:text-black">Note:</strong> You are the
						<span class="font-semibold text-gray-300 dark:text-black">owner</span> of this proposal.
						Close proposal
						{#if ended}
							<button
								class="text-white text-white underline dark:text-gray-700"
								on:click={closeProposal}
								disabled={!isOwner || !proposal.voteOpen}>here</button
							>
						{:else}
							once the time ends.
						{/if}
					</p>
				</div>
			</div>
		{/if}
	</article>
{:else}
	<article
		class="votecontent prose mx-auto mb-32 mt-4 w-full max-w-none items-start justify-center dark:prose-invert"
	>
		<div
			class="relative ml-6 mr-6 block overflow-hidden rounded-lg bg-gray-100 p-8 dark:bg-gray-700"
		>
			<span
				class="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-green-300 via-blue-500 to-purple-600"
			/>

			<div class="justify-between sm:flex">
				<div>
					<h5 class="text-xl font-bold text-slate-900 dark:text-white">
						This proposal ended on {getDate(proposalData.proposal?.endTime)}
					</h5>
					<!-- <p class="mt-1 text-xs font-medium text-slate-600">It was made by {own}</p> -->
				</div>
			</div>

			<dl class="mt-6 flex">
				<div class="flex flex-col-reverse">
					<dt class="text-sm font-medium text-slate-600 dark:text-white">
						{proposal.maxOptionsSelectable}
					</dt>
					<dd class="text-xs text-slate-500 dark:text-white">Options Selectable</dd>
				</div>

				<div class="ml-3 flex flex-col-reverse sm:ml-6">
					<dt class="text-sm font-medium text-slate-600 dark:text-white">{proposal.voterCount}</dt>
					<dd class="text-xs text-slate-500 dark:text-white">Number of Votes</dd>
				</div>
				<div class="ml-3 flex flex-col-reverse sm:ml-6">
					<dt class="text-sm font-medium text-slate-600 dark:text-white">
						{findWinningVoteOptions(proposal?.options)}
					</dt>
					<dd class="text-xs text-slate-500 dark:text-white">Winning Option(s)</dd>
				</div>
			</dl>
		</div>
		{#if !isMobile}
			<div
				class="my-4 w-full border-y border-blue-200 bg-blue-50 p-6 dark:border-gray-600 dark:bg-gray-800 sm:rounded sm:border-x"
			>
				<Bar {data} options={{ responsive: true }} />
			</div>
		{/if}
		{#if isOwner && proposal.voteOpen}
			<div
				class="relative m-px overflow-hidden rounded-md bg-slate-800 px-2 py-2 text-lg dark:bg-gray-300"
			>
				<div
					class="absolute -left-[15px] -top-[50px] z-0 h-[140px] w-[140px] rounded-full border bg-gradient-to-r from-purple-400 via-blue-500 to-green-200 blur-[60px] transition-all dark:blur-[80px]"
				/>
				<div class="relative z-10 text-center">
					<p class="text-sm text-gray-300 dark:text-black">
						<strong class="text-white dark:text-black">Note:</strong> You are the
						<span class="font-semibold text-gray-300 dark:text-black">owner</span> of this proposal.
						Close proposal
						{#if ended}
							<button
								class="text-white text-white underline dark:text-gray-700"
								on:click={closeProposal}
								disabled={!isOwner || !proposal.voteOpen}>here</button
							>
						{:else}
							once the time ends.
						{/if}
					</p>
				</div>
			</div>
		{/if}
	</article>
{/if}

<style lang="postcss">
	/* https://ryanmulligan.dev/blog/layout-breakouts/ */
	.votecontent {
		--gap: clamp(1rem, 6vw, 3rem);
		--full: minmax(var(--gap), 1fr);
		/* --content: min(65ch, 100% - var(--gap) * 2); */
		--content: 65ch;
		--popout: minmax(0, 2rem);
		--feature: minmax(0, 5rem);

		display: grid;
		grid-template-columns:
			[full-start] var(--full)
			[feature-start] 0rem
			[popout-start] 0rem
			[content-start] var(--content) [content-end]
			[popout-end] 0rem
			[feature-end] 0rem
			var(--full) [full-end];
	}

	@media (min-width: 768px) {
		.votecontent {
			grid-template-columns:
				[full-start] var(--full)
				[feature-start] var(--feature)
				[popout-start] var(--popout)
				[content-start] var(--content) [content-end]
				var(--popout) [popout-end]
				var(--feature) [feature-end]
				var(--full) [full-end];
		}
	}

	:global(.votecontent > *) {
		grid-column: content;
	}

	article :global(pre) {
		grid-column: feature;
		margin-left: -1rem;
		margin-right: -1rem;
	}

	/* hacky thing because otherwise the summary>pre causes overflow */
	article :global(summary > pre) {
		max-width: 90vw;
	}

	article :global(.popout) {
		grid-column: popout;
	}
	article :global(.feature) {
		grid-column: feature;
	}
	article :global(.full) {
		grid-column: full;
		width: 100%;
	}

	article :global(.admonition) {
		@apply border-4 border-red-500 p-8;
	}

	/* fix github codefence diff styling from our chosen prismjs theme */
	article :global(.token.inserted) {
		background: #00ff0044;
	}

	article :global(.token.deleted) {
		background: #ff000d44;
	}
</style>
