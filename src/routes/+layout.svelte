<!-- <script context="module" lang="js">
	import { Buffer } from 'buffer';
	// @ts-ignore
	globalThis.Buffer = Buffer;
</script> -->

<script>
	import '../tailwind.css';
	import Nav from '$lib/components/Nav.svelte';
	import { MY_TWITTER_HANDLE, REPO_URL } from '$lib/siteConfig';
	import { clusterApiUrl } from '@solana/web3.js';
	import { WalletProvider } from '@svelte-on-solana/wallet-adapter-ui';
	import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
	import { getLocalStorage, walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { AnchorConnectionProvider, workSpace } from '@svelte-on-solana/wallet-adapter-anchor';
	import idl from '$lib/anchor/omcvote/omcvote.json';
	import { browser } from '$app/environment';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import {
		PhantomWalletAdapter,
		GlowWalletAdapter,
		BackpackWalletAdapter,
		SolflareWalletAdapter,
		SolletExtensionWalletAdapter,
		SolletWalletAdapter,
		TorusWalletAdapter
	} from '@solana/wallet-adapter-wallets';
	import { balanceStore } from '$lib/balance';
	import { shdwBalanceStore } from '$lib/shdwbalance';
	import { forcedConnection } from '$lib/drive';
	const localStorageKey = 'walletAdapter';
	//TODO: Configurable or env variable
	const endpoint = WalletAdapterNetwork.Devnet;
	const network = clusterApiUrl(endpoint); //'https://monkecbe3a1fff727446fa5fcd091ca9b7c02.xyz2.hyperplane.dev/' ;
	let wallets = [
		new PhantomWalletAdapter(),
		new GlowWalletAdapter(),
		new BackpackWalletAdapter(),
		new SolflareWalletAdapter(),
		new SolletWalletAdapter({ network: endpoint }),
		new SolletExtensionWalletAdapter({ network: endpoint }),
		new TorusWalletAdapter()
	];
	$: autoConnect = browser && Boolean(getLocalStorage('autoconnect', true));
	const options = {};
	$: $walletStore.connected &&
		$walletStore.publicKey &&
		$workSpace?.connection &&
		balanceStore.getUserSOLBalance($walletStore.publicKey, $workSpace.connection);
	$: $walletStore.connected &&
		$walletStore.publicKey &&
		shdwBalanceStore.getShdwBalance($walletStore.publicKey, forcedConnection);
</script>

<svelte:head />

<WalletProvider {localStorageKey} {wallets} {autoConnect} />
<AnchorConnectionProvider {network} {idl} />
<SvelteToast {options} />
<div class="flex flex-col justify-center bg-gray-50 px-4 dark:bg-gray-900 sm:px-8">
	<Nav />
</div>
<main class="flex flex-col justify-center bg-gray-50 px-4 dark:bg-gray-900 sm:px-8">
	<slot />
</main>
<footer class="footer footer-center rounded bg-gray-200 p-10 text-base-content dark:bg-gray-900">
	<div class="grid grid-flow-col gap-4">
		<a class="text-gray-500 transition hover:text-gray-300" href="/">Home</a>
		<a class="text-gray-500 transition hover:text-gray-300" href="/about">About</a>
		<a class="text-gray-500 transition hover:text-gray-300" href="/#newsletter">Newsletter</a>
	</div>
	<div>
		<div class="grid grid-flow-col gap-4">
			<a
				class="text-gray-500 transition hover:text-gray-300"
				target="_blank"
				rel="noopener noreferrer"
				href={'https://twitter.com/intent/follow?screen_name=' + MY_TWITTER_HANDLE}
				><svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					class="fill-current"
					><path
						d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"
					/></svg
				></a
			>
			<a
				class="text-gray-500 transition hover:text-gray-300"
				target="_blank"
				rel="noopener noreferrer"
				href={REPO_URL}
				><svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					class="fill-current"
					><path
						d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
					/></svg
				></a
			>
		</div>
	</div>
	<div>
		<p>Copyright © 2023 - All right reserved by MonkeDAO</p>
	</div>
</footer>
<!-- <footer class="mx-auto pb-8 flex w-full max-w-2xl flex-col items-start justify-center">
	<hr class="border-1 w-full border-gray-200 dark:border-gray-800" />
	<div class="grid w-full max-w-2xl grid-cols-1 gap-4 pb-8 px-4 sm:grid-cols-2 sm:px-8">
		<div class="flex flex-col space-y-4">
			<a class="text-gray-500 transition hover:text-gray-300" href="/">Home</a>
			<a class="text-gray-500 transition hover:text-gray-300" href="/about">About</a>
			<a class="text-gray-500 transition hover:text-gray-300" href="/#newsletter">Newsletter</a>
		</div>
		<div class="flex flex-col space-y-4">
			<a
				class="text-gray-500 transition hover:text-gray-300"
				target="_blank"
				rel="noopener noreferrer"
				href={'https://twitter.com/intent/follow?screen_name=' + MY_TWITTER_HANDLE}
			>
				Twitter
			</a>
			<a
				class="text-gray-500 transition hover:text-gray-300"
				target="_blank"
				rel="noopener noreferrer"
				href={REPO_URL}
			>
				GitHub
			</a>
			<a
				class="text-gray-500 transition hover:text-gray-300"
				target="_blank"
				rel="noopener noreferrer"
				href={MY_YOUTUBE}
			>
				YouTube
			</a>
		</div>
	</div>
	<p class="prose px-4 dark:prose-invert sm:px-8">
		This app is based on this
		<a href="https://github.com/MonkeDAO/omcvote">github</a>
		repo.
	</p>
</footer> -->
