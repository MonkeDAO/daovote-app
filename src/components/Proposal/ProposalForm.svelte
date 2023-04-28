<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { SvelteComponent } from 'svelte';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace } from '@svelte-on-solana/wallet-adapter-anchor';
	import type { Connection } from '@solana/web3.js';
	import { toast } from '@zerodevx/svelte-toast';
	import Fa from 'svelte-fa';
	import { faCancel } from '@fortawesome/free-solid-svg-icons';

	const dispatch = createEventDispatcher();
	let generatedFile: File;
	let connection: Connection;
	let wallet: any;
	let title = '';
	let description = '';
	let settingsType = '';
	let settingsValue = '';
	let useEditor = false;
	let options = [{ id: 0, name: '' }];
	let maxOptions = 1;
	$: if ($walletStore?.wallet?.publicKey && $workSpace?.provider?.connection) {
		connection = $workSpace.provider.connection;
		wallet = $walletStore.wallet;
	}
	let Editor: any;
	async function loadEditor() {
    const module = await import('../Editor.svelte');
    Editor = module.default;
  }

	function submitForm() {
		if (!wallet || !connection) {
			toast.push('Please connect your wallet');
			return;
		}
		if (maxOptions < 1) {
			toast.push('Please enter a valid number of options. 1 or greater');
			return;
		}
		if (!generatedFile) {
			toast.push('Please upload a file or use the editor and generate a file');
			return;
		}
		const settings = {
			[settingsType]: settingsValue
		};

		dispatch('submit-event', {
			proposal: { title, description, settings, options, maxOptions },
			file: generatedFile
		});
		localStorage.removeItem('editorContent');
		title = '';
		description = '';
		settingsType = '';
		settingsValue = '';
		options = [{ id: 0, name: '' }];
		maxOptions = 1;
	}
	function addOption() {
		const newOptionID = options.length;
		options = [...options, { id: newOptionID, name: '' }];
	}

	function removeOption(optionID: number) {
		options = options.filter((option) => option.id !== optionID);
	}
	function toggleEditor() {
		useEditor = !useEditor;
		if (useEditor) {
      loadEditor();
    }
	}
	function handleFileSelected(event: any) {
		const selectedFile = event.target.files[0];
		generatedFile = selectedFile;
		console.log('Selected file:', selectedFile);
	}

	function handleFileGenerated(event: any) {
		console.log('event', event);
		generatedFile = event.detail;
	}
</script>

<div>
	<div class="divide-y divide-gray-200">
		<div class="space-y-4 py-8 text-base leading-6 text-gray-700 sm:text-lg sm:leading-7">
			<form on:submit|preventDefault={submitForm} class="space-y-4">
				<div class="flex flex-col">
					<label for="title" class="leading-loose">Title</label>
					<input
						type="text"
						id="title"
						bind:value={title}
						class="form-input mt-1 block w-full rounded bg-gray-400 placeholder-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
						placeholder=" Proposal Title"
						required
					/>
				</div>
				<div class="flex flex-col">
					<label for="description" class="leading-loose">Description</label>
					<textarea
						id="description"
						bind:value={description}
						class="form-textarea mt-1 block w-full rounded bg-gray-400 placeholder-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
						rows="3"
						placeholder=" This proposal is to vote on whether..."
					/>
				</div>
				<div class="flex flex-col">
					<label for="end" class="leading-loose">End Date</label>
					<div class="relative focus-within:text-gray-600 text-gray-400">
					  <input id="end" type="text" class="pr-4 pl-10 py-2 rounded bg-gray-400 placeholder-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm focus:outline-none" placeholder="26/02/2020">
					  <div class="absolute left-3 top-2">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
					  </div>
					</div>
				  </div>
				<div class="flex flex-col">
					<label for="settingsType" class="leading-loose">Settings Type</label>
					<select
						id="settingsType"
						bind:value={settingsType}
						class="form-select mt-1 block w-full rounded bg-gray-400 placeholder-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
					>
						<option value="">Select a type</option>
						<option value="option1">Option 1</option>
						<option value="option2">Option 2</option>
						<option value="option3">Option 3</option>
					</select>
				</div>
				{#if settingsType}
					<div class="flex flex-col">
						<label for="settingsValue" class="leading-loose">Settings Value</label>
						<input
							type="text"
							id="settingsValue"
							bind:value={settingsValue}
							class="form-input mt-1 block w-full rounded dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-100"
							placeholder="Settings Value"
							required
						/>
					</div>
				{/if}
				<div class="flex flex-col">
					<label for="options" class="leading-loose">Options</label>
					{#each options as option (option.id)}
						<div class="flex items-center space-x-2">
							<input
								type="text"
								bind:value={option.name}
								class="form-input mt-1 block w-full max-w-xs rounded bg-gray-400 placeholder-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
								placeholder=" Option"
								required
							/>
							<button class="btn-square btn-sm btn" on:click={() => removeOption(option.id)}>
								<Fa icon={faCancel} />
							</button>
						</div>
					{/each}
					<button type="button" class="btn-primary btn-sm btn mt-2" on:click={addOption}
						>Add Option</button
					>
				</div>
				<div class="flex flex-col">
					<label class="input-group input-group-vertical text-gray-100">
						<span>Max options voter can pick</span>
						<input
							type="number"
							bind:value={maxOptions}
							placeholder="1"
							class="input-bordered input"
							required
						/>
					</label>
				</div>
				{#if !useEditor}
					<div class="flex flex-col">
						<label for="file" class="leading-loose">Upload File</label>
						<input
							type="file"
							id="file"
							on:change={handleFileSelected}
							accept=".pdf,.docx,.txt,.json,.xlsx,.xls,.jpg,.png"
							class="file-input-primary file-input file-input-sm mt-1 w-full max-w-xs rounded bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
							required={!generatedFile}
						/>
					</div>
				{/if}
				<div class="flex items-center space-x-4 pt-4">
					<button
						class="flex w-full items-center justify-center rounded-md px-4 py-3 text-gray-900 focus:outline-none"
					>
					Cancel
					</button>
					<button
						type="submit"
						class="flex w-full items-center justify-center rounded-md bg-blue-500 px-4 py-3 text-white focus:outline-none"
						>Submit</button
					>
				</div>
			</form>
		</div>

		{#if useEditor}
			<div class="mx-auto w-full max-w-5xl">
				<button class="btn-primary btn mb-1 mt-1" on:click={toggleEditor}>Upload a File</button>
				{#if Editor}
      					<svelte:component this={Editor} on:file-generated={handleFileGenerated} />
    			{/if}
			</div>
		{:else}
			<div class="mx-auto w-full max-w-5xl">
				<button class="btn-primary btn mt-1" on:click={toggleEditor}>Use the Editor</button>
			</div>
		{/if}
	</div>
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
