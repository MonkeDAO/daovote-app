<script>
	export let title = '';
	export let expanded = false;
	let contentVisible = expanded;
</script>

<div class="flex w-full flex-col items-center">
	<button
		class="btn-primary btn w-1/4 justify-center text-white"
		on:click={() => (contentVisible = !contentVisible)}
	>
		{title}
	</button>
	{#if contentVisible}
		<div class="p-4">
			<slot />
		</div>
	{/if}
</div>
