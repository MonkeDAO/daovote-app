<script lang="ts">
    import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
    import { workSpace } from '@svelte-on-solana/wallet-adapter-anchor';
	import { PublicKey, type Signer } from '@solana/web3.js';
    async function vote() {
      try {
        /* interact with the program via rpc */
        await $workSpace?.program?.methods.gibVote({gm:{}}).accounts({
            voteAccount: new PublicKey('Hq2e9675sVMp3D2KYfyBXof2HXssHN961A7ifyUHGLMh'),
        }).signers([$workSpace.baseAccount as Signer]).rpc();
      } catch (err) {
        console.log('Transaction error: ', err);
      }
    }
  </script>
  
  <div class="wrapper-app">
    <div class="title">
      <h1>Solana Svelte Counter</h1>
      <p>
        Demo of <a href="https://github.com/solana-labs/wallet-adapter"
          >svelte-on-solana/wallet-adapter</a
        >, for implementation in Svelte of the
        <strong>wallet adapter</strong>
      </p>
    </div>
  
    {#if $walletStore?.connected}
      <div class="wrapper-content">
          <button on:click={vote}>Vote</button>
      </div>
      <p class="warning">You are connected to DevNet!</p>
    {:else}
      <p class="warning">You are not connected...</p>
    {/if}
  </div>

  <style>
    :global(body) {
      padding: 100px;
      margin: 0;
      background-color: #333333;
    }
    .wrapper-app {
      height: 100vh;
      font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS',
        sans-serif;
    }
    .title {
      text-align: center;
      color: white;
      font-size: 20px;
      margin-bottom: 40px;
    }
    a {
      color: #676796;
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
      padding: 50px;
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
      font-size: 40px;
      padding: 25px;
      color: white;
    }
    .warning {
      color: #ca4b4b;
      text-align: center;
      padding: 40px;
      font-size: 20px;
    }
  </style>