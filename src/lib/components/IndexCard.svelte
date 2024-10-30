<script>
	// href={item.slug} title={item.data.title} date={item.data.date}
	export let href = '#';
	/** @type {import('$lib/types').ContentItem} */
	export let item = undefined;
	/** @type {import('$lib/types').GHMetadata} */
	export let ghMetadata = null;
	export let title = 'Untitled post';
	/** @type {string} */
	export let stringData = 'no date';
</script>

<div class="card bg-brand-light hover:shadow-lg transition-all duration-300">
	<div class="card-body">
		<h2 class="card-title text-brand-dark">{title}</h2>
		<p class="text-secondary-dark">{stringData}</p>
		{#if item?.readingTime}
			<p class="hidden sm:inline-block">{item?.readingTime}</p>
		{/if}
		<!-- comment this in if you have multiple categories -->
		<span
			class="flex max-h-6 items-center rounded-md bg-gray-200 px-4 capitalize dark:bg-gray-700 dark:text-gray-400"
		>
			{item?.category || 'note'}
		</span>
		{#if item?.tags?.length}
			<div class="hidden flex-1 md:block">
				{#each item.tags as tag}
					<span class="px-1">
						#{tag}
					</span>
				{/each}
			</div>
		{/if}
		{#if ghMetadata && ghMetadata.reactions.total_count}
			<p class="">{ghMetadata.reactions.total_count} ♥</p>
		{/if}
	</div>
</div>
