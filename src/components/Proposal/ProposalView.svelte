<script lang="ts">
	import { onMount } from 'svelte';
	import CollapsablePanel from '../CollapsablePanel.svelte';
	import PdfViewer from '../PDFViewer.svelte';
	export let proposal: any;
	let showPdf = false;
	let showImg = false;
	let notSupported = false;

	onMount(() => {
		if (proposal.data.url.endsWith('.pdf')) {
			showPdf = true;
		} else if (
			proposal.data.url.endsWith('.png') ||
			proposal.data.url.endsWith('.jpg') ||
			proposal.data.url.endsWith('.jpeg')
		) {
			showImg = true;
		} else {
			notSupported = true;
		}
	});

	function getBadgeClass(isOpen: boolean) {
		return isOpen ? 'bg-green-500' : 'bg-red-500';
	}
</script>

<div class="card mb-16 bg-gray-200 dark:bg-gray-700 shadow-xl">
	<!-- <figure>
		
		<img src="https://via.placeholder.com/250" alt="Proposal image" />
	</figure> -->
	<div class="card-body bg-gray-200 dark:bg-gray-700">
		<h2 class="card-title text-gray-900 dark:text-gray-100">{proposal.data.title}</h2>
		<p class="text-gray-900 dark:text-gray-100">{proposal.data.summary}</p>
		<div>
			<span class="badge badge-lg text-gray-900 dark:text-gray-100 {getBadgeClass(proposal.voteOpen)}">
				{proposal.voteOpen ? 'Open' : 'Closed'}
			</span>
			<span class="ml-2 text-sm text-gray-900 dark:text-gray-100">Proposal ID: {proposal.proposalId}</span>
		</div>
		<div class="divider my-4" />
		<div class="list">
			{#each proposal.options as option}
				<div class="list-item text-gray-900 dark:text-gray-100">
					<div>
						<span class="list-item-title">{option.title}</span>
					</div>
				</div>
			{/each}
		</div>
    <div class="card-actions justify-center">
      <button class="btn-primary btn">Vote</button>
    </div>
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
</div>
