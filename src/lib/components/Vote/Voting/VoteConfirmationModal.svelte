<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	export let options: any[] = [];
	let modalInput: any;
	let optionsFormatted: string;
	$: optionsFormatted = options?.length
		? options
				.filter((option) => option.checked)
				.map((option) => option.title)
				.join(', ')
		: '';
	export function openModal() {
		modalInput.checked = true;
	}
	export function closeModal() {
		modalInput.checked = false;
	}

	function handleClick() {
		const selectedOptions = options.filter((option) => option.checked);
		dispatch('voteConfirmed', selectedOptions);
	}
</script>

<label for="vote-confirmation-modal" class="btn hidden">Open modal</label>

<input type="checkbox" id="vote-confirmation-modal" class="modal-toggle" bind:this={modalInput} />
<div class="modal">
	<div class="modal-box bg-gray-100 dark:bg-gray-900">
		<h3 class="text-2xl font-bold text-base-content">Vote Confirmation</h3>
		<p class="py-4 text-xl text-base-content/90">
			Are you sure you want to cast your vote with the selected options?
		</p>
		<p class="py-4 text-xl text-base-content/90">
			Selected options: {optionsFormatted}
		</p>
		<div class="modal-action">
			<label for="vote-confirmation-modal" class="btn">Cancel</label>
			<button class="btn-primary btn" on:click={handleClick}>Confirm</button>
		</div>
	</div>
</div>
