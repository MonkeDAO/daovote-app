<script lang="ts">
	import MobileMenu from './MobileMenu.svelte';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { PUBLIC_VOTEBANK } from '$env/static/public';
	import NavLink from './NavLink.svelte';
	import { WalletMultiButton } from '@svelte-on-solana/wallet-adapter-ui';
	import { ownerCheckStore, ownerCheckSyncStore } from '$lib/stores/ownerStore';
	import { isDark } from '$lib/stores/darkModeStore';

	let isOwner: boolean;
	$: {
		isOwner = $ownerCheckStore.isOwner;
		$ownerCheckSyncStore;
	}
	function toggleDarkMode() {
		if ($isDark) {
			document.documentElement.classList.remove('dark');
			document.documentElement.setAttribute('data-theme', 'monkedao');
			localStorage.theme = 'light';
			isDark.set(false);
		} else {
			document.documentElement.classList.add('dark');
			document.documentElement.setAttribute('data-theme', 'monkedao_dark');
			localStorage.theme = 'dark';
			isDark.set(true);
		}
	}
</script>

<nav
	class="relative mx-auto flex w-full max-w-2xl items-center justify-between border-gray-200
	py-8 text-gray-900 dark:border-gray-700 bg-base-100
	dark:text-gray-100 sm:pb-16"
>
	<a href="#skip" class="skip-nav">Skip to content</a>
	<MobileMenu />
	<ul class="ml-[-0.60rem] flex">
		<li>
			<NavLink href="/">Home</NavLink>
		</li>
		<!-- <li>
			<NavLink href="/blog">Search</NavLink>
		</li> -->
		<li>
			<NavLink href="/about">About</NavLink>
		</li>
		{#if $walletStore?.connected && isOwner}
			<li>
				<NavLink href="/votebank/{PUBLIC_VOTEBANK}/create">Create Proposal</NavLink>
			</li>
		{/if}
		{#if $walletStore?.connected}
			<li>
				<NavLink href="/delegate/create">Delegate</NavLink>
			</li>
		{/if}
		{#if $walletStore?.connected && isOwner}
			<li>
				<NavLink href="/votebank/{PUBLIC_VOTEBANK}">Info</NavLink>
			</li>
		{/if}
	</ul>
	<div class="flex items-center space-x-4">
		<WalletMultiButton maxNumberOfWallets={5} />
		<button
			aria-label="Toggle Dark Mode"
			class="ml-1 flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400 ring-yellow-400
			transition-all hover:ring-2 dark:bg-yellow-800"
			on:click={toggleDarkMode}
		>
			{#if $isDark}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					class="h-5 w-5 text-gray-800 dark:text-yellow-100"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728
						0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
					/>
				</svg>
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					class="h-5 w-5 text-gray-800 dark:text-gray-200"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
					/>
				</svg>
			{/if}
		</button>
	</div>
</nav>

<style>
	.skip-nav {
		position: absolute;
		left: -25%;
		top: -2rem;
		--tw-translate-y: -3rem;
		padding: 0.75rem 1rem;
		transition-property: transform;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 0.2s;
	}
</style>
