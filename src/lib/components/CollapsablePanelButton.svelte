<script>
	export let title = '';
	export let expanded = false;
	let contentVisible = expanded;
</script>

<div class="flex w-full flex-col items-center">
	<button
		class="btn-primary btn w-1/4 justify-center"
		on:click={() => (contentVisible = !contentVisible)}
	>
		{expanded ? `${title.replace("View", "Hide")}` : title}
	</button>
	{#if contentVisible}
		<div class="p-4">
			<slot />
		</div>
	{/if}
</div>
