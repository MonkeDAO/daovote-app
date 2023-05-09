<script>
	export let title = '';
	let checkboxId = `checkbox-${Math.random().toString(36).substr(2, 9)}`;
</script>

<div class="collapse border dark:border-base-100 bg-base-700 dark:bg-base-100 rounded-box">
	<input type="checkbox" id={checkboxId} />
	<label for={checkboxId} class="collapse-title text-xl font-medium cursor-pointer text-gray-900 dark:text-gray-100">
		{title}
	</label>
	<div class="collapse-content">
		<slot />
	</div>
</div>
