<script lang="ts">
    import { onMount } from "svelte";
    	import type { Connection } from "@solana/web3.js";
    import { ShdwDrive } from "@shadow-drive/sdk";
    import { walletStore } from "@svelte-on-solana/wallet-adapter-core";
    import { workSpace } from "@svelte-on-solana/wallet-adapter-anchor";
    import { driveStore } from "../lib/drive";
    
    export let file: File;
    let connection: Connection;
    let wallet: any;
    let fileInput;

  $: if ($walletStore?.wallet?.publicKey && $workSpace?.provider?.connection) {
    connection = $workSpace.provider.connection;
    wallet = $walletStore.wallet;
    initDrive();
  }

  async function initDrive() {
    if (connection && wallet) {
      const drive = await new ShdwDrive(connection, wallet).init();
      console.log("Drive initialized:", drive);
      driveStore.set(drive);
    }
  }

    async function uploadFile() {
    if ($driveStore) {
      try {
        console.log('connection', connection)
        const response = await $driveStore.getStorageAccounts('v2');
        if (response.length > 0) {
          const storage = response[0];
          const test = await $driveStore.uploadFile(storage.publicKey, file);
          console.log('test', test)
        }
        console.log("File uploaded successfully:", response);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  }
  </script>
  
  <!-- Your component markup -->
  <div></div>
  <button on:click="{uploadFile}">Upload to ShadowDrive</button>