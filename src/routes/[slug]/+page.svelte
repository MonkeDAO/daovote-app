<script>
	import { MY_TWITTER_HANDLE, SITE_URL } from '$lib/siteConfig';
	import 'prism-themes/themes/prism-shades-of-purple.min.css';
	import Newsletter from '$lib/components/Newsletter.svelte';
	import { page } from '$app/stores';

	/** @type {import('./$types').PageData} */
	export let data;
	console.log('\n-----data-----\n', data);

	/** @type {import('$lib/types').ContentItem} */
	$: json = data.json; // warning: if you try to destructure content here, make sure to make it reactive, or your page content will not update when your user navigat
</script>

<svelte:head>
	<title>{json.title}</title>
</svelte:head>

<article class="items-start justify-center w-full mx-auto mt-16 mb-32 prose votecontent dark:prose-invert max-w-none">
	<h1 class="md:text-center mb-8 text-3xl font-bold tracking-tight text-black dark:text-white md:text-5xl ">
		{json.title}
	</h1>
	<h4>{json.description}</h4>
	<div
		class="flex justify-between w-full mt-2 bg border-red sm:items-start md:flex-row md:items-center"
	>
		<p class="flex items-center text-sm text-gray-700 dark:text-gray-300">Created Date: {new Date().toISOString().slice(0, 10)}</p>
		<p class="flex items-center text-sm text-gray-600 dark:text-gray-400">
				<!-- <span class="mr-4 font-mono text-xs text-gray-700 text-opacity-70 dark:text-gray-300"
					>{json.ghMetadata.reactions.total_count} reactions</span
				> -->
				Close Date: {new Date().toISOString().slice(0, 10)}
		</p>
	</div>
	<div
		class="-mx-4 my-2 flex h-1 w-[100vw] bg-gradient-to-r from-purple-400 via-blue-500 to-green-200 sm:mx-0 sm:w-full"
	/>
	{@html json.content}
</article>

<div class="mx-auto">
	<div class="w-full max-w-5xl mb-12 border-t border-b border-blue-800 p-4 dark:prose-invert">
		<h1 class="text-black dark:text-white">Voting Component Here</h1>
		<h1 class="text-black dark:text-white">Fetch Votes</h1>
		<!-- <Vote /> -->
	</div>

	<Newsletter />
</div>

<style>
	/* https://ryanmulligan.dev/blog/layout-breakouts/ */
	.votecontent {
		--gap: clamp(1rem, 6vw, 3rem);
		--full: minmax(var(--gap), 1fr);
		/* --content: min(65ch, 100% - var(--gap) * 2); */
		--content: 65ch;
		--popout: minmax(0, 2rem);
		--feature: minmax(0, 5rem);

		display: grid;
		grid-template-columns:
			[full-start] var(--full)
			[feature-start] 0rem
			[popout-start] 0rem
			[content-start] var(--content) [content-end]
			[popout-end] 0rem
			[feature-end] 0rem
			var(--full) [full-end];
	}

	@media (min-width: 768px) {
		.votecontent {
			grid-template-columns:
				[full-start] var(--full)
				[feature-start] var(--feature)
				[popout-start] var(--popout)
				[content-start] var(--content) [content-end]
				var(--popout) [popout-end]
				var(--feature) [feature-end]
				var(--full) [full-end];
		}
	}

	:global(.votecontent > *) {
		grid-column: content;
	}

	article :global(pre) {
		grid-column: feature;
		margin-left: -1rem;
		margin-right: -1rem;
	}

	/* hacky thing because otherwise the summary>pre causes overflow */
	article :global(summary > pre) {
		max-width: 90vw;
	}

	article :global(.popout) {
		grid-column: popout;
	}
	article :global(.feature) {
		grid-column: feature;
	}
	article :global(.full) {
		grid-column: full;
		width: 100%;
	}

	article :global(.admonition) {
		@apply border-4 border-red-500 p-8;
	}

	/* fix github codefence diff styling from our chosen prismjs theme */
	article :global(.token.inserted) {
		background: #00ff0044;
	}

	article :global(.token.deleted) {
		background: #ff000d44;
	}
</style>
