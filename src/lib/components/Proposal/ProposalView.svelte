<script lang="ts">
	import CollapsablePanel from '$lib/components/CollapsablePanel.svelte';
	import VoteConfirmationModal from '$lib/components//Vote/Voting/VoteConfirmationModal.svelte';
	import PdfViewer from '$lib/components/PDFViewer.svelte';
	import { createEventDispatcher } from 'svelte';
	import { toast } from '@zerodevx/svelte-toast';
	export let proposal: any;
	let showPdf = false;
	let showImg = false;
	let notSupported = false;
	let options: any[];
	let voteConfirmationModal: any;

	const dispatch = createEventDispatcher();
	console.log('proposal view', proposal);

	$: proposal = proposal;

	if (proposal?.data?.url?.endsWith('.pdf')) {
		showPdf = true;
	} else if (
		proposal?.data?.url.endsWith('.png') ||
		proposal?.data?.url.endsWith('.jpg') ||
		proposal?.data?.url.endsWith('.jpeg')
	) {
		showImg = true;
	} else {
		notSupported = true;
	}
	if (proposal?.options) {
		options = proposal.options.map((option: any) => {
			return {
				id: option.id,
				title: option.title,
				checked: false
			};
		});
	}
	function handleVote() {
		const checkedOptions = options.filter((option) => option.checked);
		if (checkedOptions.length >= 1 && checkedOptions.length <= proposal.maxOptionsSelectable) {
			voteConfirmationModal.openModal();
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
		dispatch('vote', dispatchedOptions);
		options = options.map((option: any) => {
			return {
				...option,
				checked: false
			};
		});
	}
	function getBadgeClass(isOpen: boolean) {
		return isOpen ? 'bg-green-500' : 'bg-red-500';
	}
</script>

<VoteConfirmationModal
	bind:this={voteConfirmationModal}
	{options}
	on:voteConfirmed={handleVoteConfirmed}
/>
<article
	class="votecontent prose mx-auto mb-5 mt-16 w-full max-w-none items-start justify-center dark:prose-invert"
>
	<h1
		class="mb-8 text-3xl font-bold tracking-tight text-black dark:text-white md:text-center md:text-5xl"
	>
		{proposal.data.title}
	</h1>
	<h4>Proposal ID {proposal.proposalId}: {proposal.data.summary}</h4>
	<div
		class="bg border-red mt-2 flex w-full justify-between sm:items-start md:flex-row md:items-center"
	>
		<p class="flex items-center text-sm text-gray-700 dark:text-gray-300">
			Created Date: {new Date().toISOString().slice(0, 10)}
		</p>
		<div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
			Status: {proposal.voteOpen ? 'Open' : 'Closed'}
		</div>
	</div>
	<div
		class="-mx-4 my-2 flex h-1 w-[100vw] bg-gradient-to-r from-purple-400 via-blue-500 to-green-200 sm:mx-0 sm:w-full"
	/>
</article>
<div class="">
	{#if showPdf}
		<div class="mt-4">
			<CollapsablePanel title="View PDF">
				<PdfViewer pdfUrl={proposal.data.url} />
			</CollapsablePanel>
		</div>
	{:else if showImg}
		<div class="mt-4">
			<CollapsablePanel title="View Image">
				<!-- svelte-ignore a11y-img-redundant-alt -->
				<img src={proposal.data.url} alt="Proposal image" />
			</CollapsablePanel>
		</div>
	{:else if notSupported}
		<div class="mt-4">
			<h3 class="text-red-500">
				File not supported for viewer. <a href={proposal.data.url} target="_blank"
					>Click here to view</a
				>
			</h3>
		</div>
	{/if}
</div>
<article
	class="votecontent prose mx-auto mb-32 mt-16 w-full max-w-none items-start justify-center dark:prose-invert"
>
	<div
		class="my-4 w-full border-y border-blue-200 bg-blue-50 p-6 dark:border-gray-600 dark:bg-gray-800 sm:rounded sm:border-x"
	>
		<div class="flex items-center justify-between space-x-4 text-gray-900 dark:text-gray-100">
			<p class="text-lg font-bold md:text-xl">Vote</p>
			<!-- <p class="text-sm text-gray-800 dark:text-gray-200">
			You can vote for a maximum of {proposal.maxOptionsSelectable} out of {proposal.options.length}
		</p> -->
			<p class="mx-0 my-0 text-sm text-gray-800 dark:text-gray-200">
				Number of votes cast is <span class="font-bold">{proposal.voterCount}</span>
			</p>
		</div>
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
			class="right-1 top-1 mt-5 flex h-8 w-28 items-center justify-center justify-center rounded bg-gray-100 px-4 pt-1 font-medium text-gray-900 dark:bg-gray-700 dark:text-gray-100"
			on:click={handleVote}
			>Vote
		</button>
	</div>
</article>

<style>
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
