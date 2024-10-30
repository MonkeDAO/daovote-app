<script lang="ts">
	import { createEventDispatcher, onDestroy } from 'svelte';
	import { DateInput } from 'date-picker-svelte';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace } from '@svelte-on-solana/wallet-adapter-anchor';
	import type { Connection } from '@solana/web3.js';
	import { toast } from '@zerodevx/svelte-toast';
	import Fa from 'svelte-fa';
	import { faCancel, faRefresh } from '@fortawesome/free-solid-svg-icons';
	import LoadingOverlay from '../LoadingOverlay.svelte';
	import { uploadRequestStore } from '$lib/stores/uploadRequestStore';
	import { nftStore } from '$lib/stores/nftStore';
	import { PUBLIC_COLLECTION_SIZE } from '$env/static/public';

	const dispatch = createEventDispatcher();
	let generatedFile: File;
	let skipFileUpload: boolean;
	let connection: Connection;
	let wallet: any;
	let title = '';
	let description = '';
	let endDate: Date | null | undefined = null;
	const currDate = new Date();
	const maxDate = new Date(currDate.getFullYear() + 5, currDate.getMonth(), currDate.getDate());
	let settingsType = '';
	let settingsValue = '';
	let useEditor = false;
	let options = [{ id: 0, name: '' }];
	let maxOptions = 1;
	let quorumRequirement = 0;
	$: if ($walletStore?.wallet?.publicKey && $workSpace?.provider?.connection) {
		connection = $workSpace.provider.connection;
		wallet = $walletStore.wallet;
	}
	let Editor: any;
	async function loadEditor() {
		const module = await import('../Editor.svelte');
		Editor = module.default;
	}

	function handleSkipUpload() {
		skipFileUpload = !skipFileUpload;
	}
	const unsub = uploadRequestStore.subscribe((value) => {
		if (value.isSuccess) {
			resetForm();
			uploadRequestStore.clear();
		}
	});
	function resetForm() {
		title = '';
		description = '';
		settingsType = '';
		settingsValue = '';
		endDate = null;
		options = [{ id: 0, name: '' }];
		maxOptions = 1;
		quorumRequirement = 0;
	}
	function isSelectedDateValid(selectedDate: Date): boolean {
		// Create a new Date object representing the current date and time
		const currentDate = new Date();

		// Set hours, minutes, seconds, and milliseconds to 0
		currentDate.setHours(0, 0, 0, 0);

		// Compare the selected date with the current date
		return selectedDate >= currentDate;
	}

	async function refetchNfts() {
		const publicKey = $walletStore?.wallet?.publicKey?.toBase58();
		if (publicKey) {
			await nftStore.fetchNftsFromServer(publicKey);
		}
	}

	function submitForm() {
		if (!wallet || !connection) {
			toast.push('Please connect your wallet');
			return;
		}
		if (endDate && !isSelectedDateValid(endDate)) {
			toast.push('End dates must be in the future');
			return;
		}
		if (!endDate) {
			toast.push('Please enter a valid end date');
			return;
		}
		if (maxOptions < 1) {
			toast.push('Please enter a valid number of options. 1 or greater');
			return;
		}
		if (maxOptions > options.length) {
			toast.push(
				'Please enter a valid number of max options. Less than the number of vote options'
			);
			return;
		}
		if (!generatedFile && !skipFileUpload) {
			toast.push('Please upload a file or use the editor and generate a file');
			return;
		}
		const settings = {
			[settingsType]: settingsValue
		};
		const quorumThreshold = quorumRequirement > 0 ? Math.ceil((quorumRequirement / 100) * Number(PUBLIC_COLLECTION_SIZE)) : 0;
		dispatch('submit-event', {
			proposal: { title, description, settings, options, maxOptions, endDate, quorumRequirement: quorumThreshold },
			skipUpload: skipFileUpload,
			file: generatedFile
		});
		localStorage.removeItem('editorContent');
	}
	function addOption() {
		const newOptionID = options.length;
		options = [...options, { id: newOptionID, name: '' }];
	}

	function removeOption(optionID: number) {
		if (options.length === 1) {
			return;
		}
		options = options.filter((option) => option.id !== optionID);
		if (maxOptions > options.length) {
			maxOptions = options.length;
		}
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
	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			// If you want to add the new option when Enter key is pressed
			addOption();
		}
	}
	onDestroy(unsub);
</script>

<LoadingOverlay />
<div>
	<div class="divide-y divide-gray-200">
		<div class="relative space-y-4 py-8 text-base leading-6 text-gray-700 sm:text-lg sm:leading-7">
			<form on:submit|preventDefault={submitForm} class="space-y-4">
				<div class="flex flex-col">
					<label for="title" class="leading-loose">Title</label>
					<input
						type="text"
						id="title"
						bind:value={title}
						class="custom-input max-ws-xs input-bordered input-primary input mt-1 w-full rounded"
						placeholder=" Proposal Title"
						required
					/>
				</div>
				<div class="flex flex-col">
					<label for="description" class="leading-loose">Description</label>
					<textarea
						id="description"
						bind:value={description}
						class="textarea-primary textarea mt-1 block h-24 w-full rounded bg-gray-200 placeholder-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
						rows="3"
						placeholder=" This proposal is to vote on whether..."
					/>
				</div>
				<div class="flex flex-col">
					<label for="end" class="leading-loose">End Date</label>
					<div class="date-picker-container relative text-gray-400 focus-within:text-gray-600">
						<div class="absolute left-3 top-2">
							<svg
								class="h-6 w-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
						</div>
						<div class="relative pl-10">
							<DateInput bind:value={endDate} min={new Date()} max={maxDate} />
						</div>
					</div>
				</div>
				<!-- TODO: Come back to this:
					<div class="flex flex-col">
					<label for="settingsType" class="leading-loose">Settings Type</label>
					<select
						id="settingsType"
						bind:value={settingsType}
						class="form-select mt-1 block w-full rounded bg-gray-200 placeholder-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
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
				{/if} -->
				<div class="flex flex-col">
					<div class="rounded-lg bg-gray-300 dark:bg-gray-700 overflow-hidden">
						<div class="px-4 py-3 dark:bg-gray-800 dark:text-white">
							Quorum Requirement (%)
						</div>
						<div class="flex items-center px-4 py-3">
							<input
								type="number"
								bind:value={quorumRequirement}
								min="0"
								max="100"
								placeholder="0"
								class="w-full bg-gray-300 dark:bg-gray-700 dark:text-white text-2xl focus:outline-none"
								required
							/>
							<span class="dark:text-white text-2xl">%</span>
						</div>
						{#if typeof PUBLIC_COLLECTION_SIZE !== 'undefined'}
							<div class="px-4 py-2 dark:bg-gray-900 dark:text-gray-400 text-sm">
								{Math.ceil((quorumRequirement / 100) * Number(PUBLIC_COLLECTION_SIZE))} out of {PUBLIC_COLLECTION_SIZE} votes required
							</div>
						{/if}
					</div>
				</div>
				<div class="flex flex-col">
					<label for="options" class="leading-loose">Options</label>
					{#each options as option (option.id)}
						<div class="flex items-center space-x-2">
							<input
								type="text"
								bind:value={option.name}
								class="custom-input max-ws-xs input-primary input mt-1 block w-full rounded"
								placeholder=" Option"
								required
								on:keypress={(event) => handleKeyPress(event)}
							/>
							<button
								type="button"
								class="btn-square btn-sm btn"
								on:click={() => removeOption(option.id)}
							>
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
						<span class="bg-gray-200 text-black dark:bg-gray-700 dark:text-gray-100"
							>Max options voter can pick</span
						>
						<input
							type="number"
							bind:value={maxOptions}
							placeholder="1"
							class="input-bordered input bg-gray-200 text-black placeholder-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
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
							class="file-input-bordered file-input file-input-sm mt-1 w-full max-w-xs rounded bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
							required={!skipFileUpload && !generatedFile}
						/>
						<label class="label mt-5 cursor-pointer">
							<label for="skip-file-upload" class="leading-loose">Skip File Upload</label>
							<div
								class="tooltip"
								data-tip="Descriptions can't be that long. It is recommended to upload a file."
							>
								<input
									type="checkbox"
									on:change={handleSkipUpload}
									checked={skipFileUpload}
									class="checkbox-primary checkbox"
								/>
							</div>
						</label>
					</div>
				{/if}
				<div class="flex items-center space-x-4 pt-4">
					<button
						type="button"
						class="flex w-full items-center justify-center rounded-md px-4 py-3 text-gray-900 focus:outline-none"
						on:click={() => resetForm()}
					>
						Reset
					</button>
					<button
						type="submit"
						class="flex w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-white"
						>Submit</button
					>
				</div>
			</form>
			<div class="flex justify-end">
				<!-- Added a wrapper div -->
				<a
					href="#"
					class="mt-8 inline-flex cursor-pointer items-center text-blue-500 hover:underline"
					on:click|preventDefault={refetchNfts}
				>
					<Fa icon={faRefresh} class="mr-2" />Refetch NFTs
				</a>
			</div>
		</div>

		<!-- {#if useEditor}
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
		{/if} -->
	</div>
</div>

<style lang="postcss">
	button {
		border: none;
		padding: 8px;
		border-radius: 5px;
		font-size: 16px;
		cursor: pointer;
		color: white;
		background-color: bg-primary;
	}
	.date-picker-container {
		/* --date-picker-background: #1b1e27;
    --date-picker-foreground: #f7f7f7; */
		--date-input-width: 100%;
	}
	.custom-input {
		@apply bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500;
	}
</style>
