<script>
	export let title = '';
	export let expanded = false;
	let contentVisible = expanded;
</script>

<div class="flex w-full flex-col items-center">
	<button
		class="btn bg-secondary hover:bg-secondary-dark text-accent-white w-full justify-between"
		on:click={() => (contentVisible = !contentVisible)}
	>
		<slot />
	</button>
	{#if contentVisible}
		<div class="p-4">
			<slot />
		</div>
	{/if}
</div>
