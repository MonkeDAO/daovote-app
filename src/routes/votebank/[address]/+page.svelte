<!-- src/routes/votebank/[address]/+page.svelte -->
<script lang="ts">
	import type { Program, Idl } from '@project-serum/anchor';
	import { Connection, PublicKey } from '@solana/web3.js';
	import { workSpace } from '@svelte-on-solana/wallet-adapter-anchor';
    import VoteBankCard from '$lib/components/Vote/VoteBanks/VoteBankCard.svelte';
	import { ConvertVotebank, type VoteBank } from '$lib/anchor/omcvote/types';
	/** @type {import('./$types').PageData} */
	export let data: any;
	let voteBankData: VoteBank;
	let program: Program<Idl>;
	let connection: Connection;
	let voteBankInfo: {
		name: string;
		description: string;
		address: string;
	};
	let loading = true;
	let loadingMessage = 'Loading VoteBank..';
	$: if ($workSpace?.provider?.connection && $workSpace.program) {
		program = $workSpace.program;
		connection = $workSpace.provider.connection;
	}

	async function fetchVoteBank() {
		loading = true;
		try {
			const voteBank = await program.account.votebank.fetch(new PublicKey(data.address));
			//Ensure typing is correct
			voteBankData = ConvertVotebank.toVoteBank(JSON.stringify(voteBank));
			voteBankInfo = {
				name: voteBankData.settings?.find((x: any) => x.description)?.description?.title || '',
				description:
					voteBankData.settings?.find((x: any) => x.description)?.description?.desc || '',
				address: data.address
			};
			loading = false;
		} catch (err) {
			loadingMessage = 'VoteBank not found';
			loading = false;
			console.log('err', err);
		}
	}
	$: if (program) {
		fetchVoteBank();
	}
	console.log('data', data);
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
