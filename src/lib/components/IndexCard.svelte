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

<a
	class="w-full text-gray-900 hover:text-yellow-600 hover:no-underline dark:text-gray-100 dark:hover:text-yellow-100"
	{href}
	><div class="w-full">
		<div class="flex flex-col justify-between md:flex-row">
			<h4 class="mb-2 w-full flex-auto text-lg font-bold md:text-xl">
				{title}
			</h4>
		</div>
		<p
			class="mb-2 break-all text-gray-600 hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-100 sm:break-words"
		>
			<slot />
		</p>
		<div
			class="flex items-center justify-between gap-1 text-left text-gray-500 sm:flex-row sm:justify-start sm:gap-4 md:mb-0 md:text-sm"
		>
			<!-- {JSON.stringify(item.readingTime)} -->
			<p>{stringData}</p>
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
	</div></a
>
