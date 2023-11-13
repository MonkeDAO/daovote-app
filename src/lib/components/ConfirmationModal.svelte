<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	export let data: any;
	export let message: string = 'Are you sure?';
	export let eventOnConfirm: string = 'confirmed';
	export let id: string = 'confirmation-modal';

	let modalInput: any;

	export function openModal() {
		modalInput.checked = true;
	}
	export function closeModal() {
		modalInput.checked = false;
	}

	function handleClick() {
		dispatch(eventOnConfirm, data);
	}
</script>

<label for="{id}" class="btn hidden">Open modal</label>

<input type="checkbox" id="{id}" class="modal-toggle" bind:this={modalInput} />
<div class="modal">
	<div class="modal-box bg-gray-100 dark:bg-gray-900">
		<h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">Confirmation</h3>
		<p class="py-4 text-gray-900 dark:text-gray-100">{message}</p>
		<div class="modal-action">
			<label for="{id}" class="btn-error btn">Cancel</label>
			<button class="btn-primary btn" on:click={handleClick}>Confirm</button>
		</div>
	</div>
</div>
