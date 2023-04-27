<!-- src/routes/votebank/[address]/+page.svelte -->
  <script lang="ts">
	import type { Program, Idl } from '@project-serum/anchor';
	import { Connection, PublicKey } from '@solana/web3.js';
    import { workSpace } from '@svelte-on-solana/wallet-adapter-anchor';
	import { ConvertVotebank, type VoteBank } from '../../../anchor/omcvote/types';
	import VoteBankCard from '../../../components/Vote/VoteBanks/VoteBankCard.svelte';
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
    let loadingMessage = "Loading VoteBank.."
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
                description: voteBankData.settings?.find((x: any) => x.description)?.description?.desc || '',
                address: data.address
            }
            loading = false;
        }
        catch (err) {
            loadingMessage = "VoteBank not found"
            console.log('err', err)
        }
    }
    $: if (program) {
        fetchVoteBank();
    }
    console.log('data', data)
  </script>
  
  <div class="mx-auto flex max-w-2xl mb-16">
    <div class="max-w-2xl mb-2">
    {#if loading}
            <h1 class="text-5xl font-bold text-gray-900 dark:text-gray-100">{loadingMessage}</h1>
            <progress class="progress progress-primary w-56"></progress>
            {#if !connection}
                <p class="text-xl text-gray-600 dark:text-gray-100 mt-4">
                    Please connect your wallet
                </p>
            {/if}
    {:else}
    {#if voteBankData}
          <VoteBankCard voteData={{voteBank: voteBankData, address: data.address}} />
      {/if}
    {/if}
    </div>
</div>