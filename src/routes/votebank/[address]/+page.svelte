<!-- src/routes/votebank/[address]/+page.svelte -->
<script lang="ts">
	import type { Connection } from '@solana/web3.js';
	import { workSpace } from '@svelte-on-solana/wallet-adapter-anchor';
	import VoteBankCard from '$lib/components/Vote/VoteBanks/VoteBankCard.svelte';
	/** @type {import('./$types').PageData} */
	export let data: any;
	let voteBankData: any;
	let connection: Connection;
	let loading = true;
	let loadingMessage = 'Loading VoteBank..';
	$: if ($workSpace?.provider?.connection && $workSpace.program) {
		connection = $workSpace.provider.connection;
	}
	$: if (data.votebank) {
		voteBankData = data.votebank;
		loading = false;
	}

</script>

<div class="mx-auto mb-16 flex max-w-2xl">
	<div class="mb-2 max-w-2xl">
		{#if loading}
			<h1 class="text-5xl font-bold text-gray-900 dark:text-gray-100">{loadingMessage}</h1>
			<progress class="progress progress-primary w-56" />
			{#if !connection}
				<p class="mt-4 text-xl text-gray-600 dark:text-gray-100">Please connect your wallet</p>
			{/if}
		{:else if voteBankData}
			<VoteBankCard voteData={{ voteBank: voteBankData, address: data.address }} />
		{/if}
	</div>
</div>
