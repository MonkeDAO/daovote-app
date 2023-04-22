<script lang="ts">
    import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
    import { workSpace } from '@svelte-on-solana/wallet-adapter-anchor';
	import { PublicKey, Transaction } from '@solana/web3.js';
    import { toast } from '@zerodevx/svelte-toast'
    let value: any;
    $: console.log('value: ', value);
    async function createVote() {
      try {
        /* interact with the program via rpc */
        console.log('Vote', $workSpace.baseAccount?.publicKey.toBase58());
        const testAcc2 = await $workSpace.program?.account.voteBank.fetch($workSpace.baseAccount!.publicKey!).catch((err) => {
            console.log('err', err)});
        if (testAcc2) {
            console.log('testAcc', testAcc2)
            value = {
                voteBank: JSON.stringify(testAcc2),
                address: $workSpace.baseAccount?.publicKey.toBase58()
            }
            return
        }
        const init = await $workSpace.program?.methods.initVoteBank().accounts({
            voteAccount: $workSpace.baseAccount!.publicKey!,
        }).signers([$workSpace.baseAccount!]).rpc();
        console.log('init tx:', init)
        const voteBank = await $workSpace.program?.account.voteBank.fetch($workSpace.baseAccount!.publicKey!);
        value = {
            voteBank: JSON.stringify(voteBank),
            address: $workSpace.baseAccount?.publicKey.toBase58()
        }
        toast.push(`VoteBank created ${$workSpace.baseAccount?.publicKey.toBase58()}`, {
            duration: 3000,
            pausable: true, 
        });
      } catch (err) {
        console.log('Transaction error: ', err);
      }
    }
    async function vote(vote: string) {
      try {
        /* interact with the program via rpc */
        console.log('Vote', $workSpace?.program, $workSpace.baseAccount?.publicKey.toBase58());
        const { connection,  } = $workSpace;
        let voteValue = {}
        if (vote) {
            if (vote === 'gm') {
                voteValue = {gm: {}}
            } else {
                voteValue = {gn: {}}
            }
        }
        const ix = await $workSpace.program?.methods.gibVote(voteValue).accounts({
            voteAccount: new PublicKey(value.address)!,
        }).instruction();
        const txn = new Transaction().add(ix!);
        const tx = await $walletStore.sendTransaction(txn, connection, {
            skipPreflight: true,
        });
        toast.push(`Voted for ${vote}`, {
            duration: 3000,
        });
        console.log('txn', tx)
      } catch (err) {
        console.log('Transaction error: ', err);
      }
    }
  </script>

  <div>
    <div class="title">
      <h1>Solana Svelte Anchor Vote</h1>
    </div>
    {#if $walletStore?.connected}
    <div class="wrapper-content">
      {#if value}
        <button on:click={() => vote('gm')}>Vote GM</button>
        <button on:click={() => vote('gn')}>Vote GN</button>
        <p class="value">
          VoteBank: 
          {#key value}
            {value.address}
          {/key}
          <br/>
          Vote Opened: 
          {#key value}
            {JSON.parse(value.voteBank).isOpenToVote}
          {/key}
        </p>
      {:else}
        <button on:click={createVote}>Create vote</button>
      {/if}
    </div>
  {:else}
    <p class="warning">You are not connected...</p>
  {/if}
  </div>

  <style>
    .title {
      text-align: center;
      color: white;
      font-size: 20px;
      margin-bottom: 40px;
    }
    .address {
      position: absolute;
      right: 30px;
      top: 30px;
      border-radius: 5px;
      padding: 10px;
    }
    .wrapper-content {
      border-radius: 5px;
      padding: 20px;
      width: 400px;
      margin: 0 auto;
      text-align: center;
      margin-bottom: 30px;
    }
    button {
      border: none;
      padding: 16px;
      border-radius: 5px;
      font-size: 16px;
      cursor: pointer;
      color: white;
      background-color: #4e44ce;
    }
    .value {
      font-size: 18px;
      padding: 20px;
      color: white;
    }
    .warning {
      color: #ca4b4b;
      text-align: center;
      padding: 40px;
      font-size: 20px;
    }
  </style>