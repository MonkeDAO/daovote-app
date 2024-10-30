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
	<div class="modal-box bg-accent-light">
		<h3 class="font-bold text-lg text-brand-dark">Confirmation</h3>
		<p class="py-4 text-secondary-dark">{message}</p>
		<div class="modal-action">
			<button class="btn bg-brand text-accent-white hover:bg-brand-dark" on:click={handleClick}>
				Confirm
			</button>
			<button class="btn bg-secondary text-accent-white hover:bg-secondary-dark" on:click={closeModal}>
				Cancel
			</button>
		</div>
	</div>
</div>
