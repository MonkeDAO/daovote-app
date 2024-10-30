<script lang="ts">
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { ownerCheckStore, ownerCheckSyncStore } from '$lib/stores/ownerStore';
	import { PUBLIC_VOTEBANK } from '$env/static/public';
	let isOwner: boolean;
	$: {
		isOwner = $ownerCheckStore.isOwner;
		$ownerCheckSyncStore;
	}
	let isOpen = false;
	let isMenuRendered: boolean;
	$: {
		if (isOpen) {
			setTimeout(() => {
				isMenuRendered = true;
			}, 20);
		} else {
			setTimeout(() => {
				isMenuRendered = false;
			}, 300);
		}
	}
</script>

<div class="ml-[-0.60rem] md:hidden">
	<button
		class="burger visible"
		aria-label="Toggle menu"
		type="button"
		on:click={() => (isOpen = !isOpen)}
	>
		{#if !isOpen}
			<svg
				class="absolute h-5 w-5 text-secondary-dark dark:text-accent-light"
				width="20"
				height="20"
				viewBox="0 0 20 20"
				fill="none"
			>
				<path
					d="M2.5 7.5H17.5"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
						stroke-linejoin="round"
				/>
				<path
					d="M2.5 12.5H17.5"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
						stroke-linejoin="round"
				/>
			</svg>
		{:else}
			<svg
				class="absolute h-5 w-5 text-secondary-dark dark:text-accent-light"
				viewBox="0 0 24 24"
				width="24"
				height="24"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				fill="none"
				shape-rendering="geometricPrecision"
				data-hide="true"
			>
				<path d="M18 6L6 18" />
				<path d="M6 6l12 12" />
			</svg>
		{/if}
	</button>
	{#if isOpen}
		<ul
			class="menu absolute flex flex-col bg-accent-white text-2xl uppercase dark:bg-brand-dark"
			class:menuRendered={isMenuRendered}
		>
			<li
				class="border-b border-brand-light font-semibold text-secondary-dark dark:border-secondary-dark dark:text-accent-light"
				style="transition-delay: 150ms;"
			>
				<a
					class="flex w-auto pb-4"
					on:click={() => setTimeout(() => (isOpen = false), 300)}
					href="/"
				>Home</a>
			</li>
			{#if $walletStore?.connected && isOwner}
				<li
					class="border-b border-brand-light font-semibold text-secondary-dark dark:border-secondary-dark dark:text-accent-light"
					style="transition-delay: 350ms;"
				>
					<a
						class="flex w-auto pb-4"
						on:click={() => setTimeout(() => (isOpen = false), 300)}
						href={`/votebank/${PUBLIC_VOTEBANK}/create`}
					>Create Proposal</a>
				</li>
			{/if}
			<li
				class="border-b border-brand-light font-semibold text-secondary-dark dark:border-secondary-dark dark:text-accent-light"
				style="transition-delay: 350ms;"
			>
				<a
					class="flex w-auto pb-4"
					on:click={() => setTimeout(() => (isOpen = false), 300)}
					href="/about"
				>About</a>
			</li>
			<li
				class="border-b border-brand-light font-semibold text-secondary-dark dark:border-secondary-dark dark:text-accent-light"
				style="transition-delay: 400ms;"
			>
				<a
					class="flex w-auto pb-4"
					on:click={() => setTimeout(() => (isOpen = false), 300)}
					href="https://github.com/MonkeDAO/omcvote"
				>GitHub</a>
			</li>
		</ul>
	{/if}
</div>

<style lang="postcss">
	.burger {
		@apply transition-opacity duration-300;
		border: 0;
		background: transparent;
		width: 40px;
		height: 40px;
		position: relative;
	}

	.menu {
		padding: 0 28px 0 4px;
		margin: 0;
		padding-top: 24px;
		width: 100%;
		height: 100vh;
		z-index: 1000;
		opacity: 0;
		left: 0;
		@apply transition-all duration-300;
	}

	.menu li {
		transform: translateX(-16px);
		opacity: 0;
		@apply transition-all duration-300;
		width: 0px;
		white-space: nowrap;
	}

	.menuRendered {
		opacity: 1;
	}

	.menuRendered li {
		@apply w-full;
		transform: translateX(0);
		opacity: 1;
	}

	.menu > * + * {
		margin-top: 24px;
	}
</style>
