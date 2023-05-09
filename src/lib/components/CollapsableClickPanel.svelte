<script>
	export let title = '';
	let checkboxId = `checkbox-${Math.random().toString(36).substr(2, 9)}`;
</script>

<div class="bg-base-700 rounded-box collapse border dark:border-base-100 dark:bg-base-100">
	<input type="checkbox" id={checkboxId} />
	<label
		for={checkboxId}
		class="collapse-title cursor-pointer text-xl font-medium text-gray-900 dark:text-gray-100"
	>
		{title}
	</label>
	<div class="collapse-content">
		<slot />
	</div>
</div>
