<script lang="ts">
	import { page } from '$app/stores';
	import { navigating } from '$app/stores';
	
	export let href: string;
	$: isActive = $page.url.pathname === href;
	$: isLoading = $navigating?.to?.url.pathname === href;
</script>

<a
	class="hidden rounded-lg p-1 text-base-content transition-all hover:bg-yellow-200 hover:text-base-content/80 dark:hover:bg-yellow-600 sm:px-3 sm:py-2 md:inline-block"
	class:font-semibold={isActive}
	class:animate-pulse={isLoading}
	{href}
>
	<span class="capsize relative">
		<slot />
		{#if isLoading}
			<span class="absolute -right-4 top-1/2 -translate-y-1/2">
				<span class="loading loading-spinner loading-xs text-base-content/60"></span>
			</span>
		{/if}
	</span>
</a>
