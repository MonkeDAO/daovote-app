<script>
	export let title = 'Untitled post';
	export let href = '#';
	/** @type {string} */
	export let stringData; // we intentionally force this prop to be a string, not children, because dont want to allow arbitrary display of components for such a small contained component. feel free to refactor this if you need to
</script>

<a
	class="w-full transform rounded-xl bg-gradient-to-r from-brand-light via-secondary-light to-accent p-1 transition-all hover:scale-[1.01] md:w-1/3"
	{href}
>
	<div class="card bg-brand-light hover:bg-brand hover:text-accent-white transition-colors duration-300">
		<div class="card-body">
			<h2 class="card-title text-brand-dark">
				{title}
			</h2>
			<div class="capsize flex items-center text-secondary-dark">
				{stringData}
			</div>
		</div>
	</div>
</a>
