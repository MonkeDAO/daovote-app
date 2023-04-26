<script lang="ts">
    import { createEventDispatcher } from "svelte";
	import Editor from "../Editor.svelte";
  import { walletStore } from "@svelte-on-solana/wallet-adapter-core";
  import { workSpace } from "@svelte-on-solana/wallet-adapter-anchor";
	import type { Connection } from "@solana/web3.js";
  import { toast } from '@zerodevx/svelte-toast'
  import Fa from 'svelte-fa';
	import {
		faCancel,
	} from '@fortawesome/free-solid-svg-icons';

    const dispatch = createEventDispatcher();
    let generatedFile: File;
    let connection: Connection;
    let wallet: any;
    let title = "";
    let description = "";
    let settingsType = "";
    let settingsValue = "";
    let useEditor = false;
    let options = [{ id: 0, name: '' }];
    let maxOptions = 1;
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
  
      dispatch("submit-event", { proposal: { title, description, settings, options, maxOptions }, file: generatedFile });
      localStorage.removeItem("editorContent");
    }
    function addOption() {
    const newOptionID = options.length;
    options = [...options, { id: newOptionID, name: '' }];
  }

  function removeOption(optionID: number) {
    options = options.filter(option => option.id !== optionID);
  }
    function toggleEditor() {
      useEditor = !useEditor;
    }
    function handleFileSelected(event: any) {
      const selectedFile = event.target.files[0];
  generatedFile = selectedFile;
  console.log("Selected file:", selectedFile);
}

      function handleFileGenerated(event: any) {
        console.log('event', event)
        generatedFile = event.detail;
      }
  </script>
  
  <div class="p-4 bg-gray-300 dark:bg-gray-800 rounded-md shadow-lg">
    <form on:submit|preventDefault="{submitForm}" class="space-y-4">
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
        <input type="text" id="title" bind:value="{title}" class="form-input mt-1 block w-full bg-gray-400 placeholder-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 rounded" placeholder=" Title" required />
      </div>
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <textarea id="description" bind:value="{description}" class="form-textarea mt-1 block w-full bg-gray-400 placeholder-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 rounded" rows="3" placeholder=" Description"></textarea>
      </div>
      <div>
        <label for="settingsType" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Settings Type</label>
        <select id="settingsType" bind:value="{settingsType}" class="form-select bg-gray-400 text-gray-700 mt-1 block w-full dark:bg-gray-700 dark:text-gray-100 rounded">
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
      <div>
        <label for="options" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Options</label>
        {#each options as option (option.id)}
          <div class="flex space-x-2 items-center">
            <input type="text" bind:value={option.name} class="form-input mt-1 block w-full bg-gray-400 placeholder-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 rounded max-w-xs" placeholder="Option" required />
            <button class="btn btn-square btn-sm" on:click={() => removeOption(option.id)}>
              <Fa icon={faCancel} />
            </button>
          </div>
        {/each}
        <button type="button" class="btn btn-primary btn-sm mt-2" on:click={addOption}>Add Option</button>
      </div>
      <div>
        <label class="input-group input-group-vertical">
          <span>Max options voter can pick</span>
          <input type="number" bind:value={maxOptions} placeholder="1" class="input input-bordered" required/>
        </label>
      </div>
      {#if !useEditor}
        <div>
          <label for="file" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload File</label>
          <input type="file" id="file" on:change="{handleFileSelected}" accept=".pdf,.docx,.txt,.json,.xlsx,.xls,.jpg,.png" class="file-input file-input-sm file-input-primary rounded mt-1 bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 w-full max-w-xs" required={!generatedFile}/>
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