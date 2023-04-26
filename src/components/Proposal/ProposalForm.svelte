<script lang="ts">
    import { createEventDispatcher } from "svelte";
	import Editor from "../Editor.svelte";
  import { walletStore } from "@svelte-on-solana/wallet-adapter-core";
  import { workSpace } from "@svelte-on-solana/wallet-adapter-anchor";
	import type { Connection } from "@solana/web3.js";
  import { toast } from '@zerodevx/svelte-toast'
  
    const dispatch = createEventDispatcher();
    let generatedFile: File;
    let connection: Connection;
    let wallet: any;
    let title = "";
    let description = "";
    let settingsType = "";
    let settingsValue = "";
    let useEditor = false;
    $: if ($walletStore?.wallet?.publicKey && $workSpace?.provider?.connection) {
      connection = $workSpace.provider.connection;
      wallet = $walletStore.wallet;
    }
  
    function submitForm() {
      if (!wallet || !connection) {
        toast.push('Please connect your wallet')
        return;
      }
      if (!generatedFile){
        toast.push('Please upload a file or use the editor and generate a file')
        return;
      } 
      const settings = {
        [settingsType]: settingsValue,
      };
  
      dispatch("submit-event", { title, description, settings, file: generatedFile });
    }
    function toggleEditor() {
      useEditor = !useEditor;
    }
    function handleFileSelected(event: any) {
      const selectedFile = event.target.files[0];

  // Check the file extension
  //     const allowedTypes = [".pdf", ".docx", ".txt", ".json"];
  //     const fileExtension = selectedFile.name.split(".").pop();
  //     if (!allowedTypes.includes(`.${fileExtension}`)) {
  //       console.error("Invalid file type. Please select a PDF, DOCX, TXT, or JSON file.");
  //   return;
  // }

  // Do something with the selected file
  generatedFile = selectedFile;
  console.log("Selected file:", selectedFile);
}

      function handleFileGenerated(event: any) {
        console.log('event', event)
        generatedFile = event.detail;
      }
  </script>
  
  <div class="p-4 bg-gray-400 dark:bg-gray-800 rounded-md shadow-lg">
    <form on:submit|preventDefault="{submitForm}" class="space-y-4">
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
        <input type="text" id="title" bind:value="{title}" class="form-input mt-1 block w-full dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 rounded" placeholder=" Title" required />
      </div>
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <textarea id="description" bind:value="{description}" class="form-textarea mt-1 block w-full dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 rounded" rows="3" placeholder=" Description"></textarea>
      </div>
      <div>
        <label for="settingsType" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Settings Type</label>
        <select id="settingsType" bind:value="{settingsType}" class="form-select mt-1 block w-full dark:bg-gray-700 dark:text-gray-100 rounded">
          <option value="">Select a type</option>
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        </select>
      </div>
      {#if settingsType}
        <div>
          <label for="settingsValue" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Settings Value</label>
          <input type="text" id="settingsValue" bind:value="{settingsValue}" class="form-input mt-1 block w-full dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 rounded" placeholder="Settings Value" required />
        </div>
      {/if}
      {#if !useEditor}
        <div>
          <label for="file" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload File</label>
          <input type="file" id="file" on:change="{handleFileSelected}" accept=".pdf,.docx,.txt,.json,.xlsx,.xls,.jpg,.png" class="file-input file-input-md file-input-primary rounded mt-1 bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 w-full max-w-xs" required={!generatedFile}/>
        </div>
      {/if}
      <button type="submit" class="btn btn-primary">Submit</button>
    </form>
    {#if useEditor}
      <div class="mx-auto w-full max-w-5xl">
        <button class="btn btn-primary mt-1 mb-1" on:click={toggleEditor}>Upload a File</button>
        <Editor on:file-generated={handleFileGenerated} />
      </div>
    {:else}
      <div class="mx-auto w-full max-w-5xl">
        <button class="btn btn-primary mt-1" on:click={toggleEditor}>Use the Editor</button>
      </div>
    {/if}
  </div>

<style>
.editor-content {
    width: 100%; /* Set the default width to 100% of the parent element */
    min-width: 400px; /* Set a minimum width for the editor */
  }
  button {
      border: none;
      padding: 8px;
      border-radius: 5px;
      font-size: 16px;
      cursor: pointer;
      color: white;
      background-color: #4e44ce;
    }
</style>