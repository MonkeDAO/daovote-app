<!-- <script context="module" lang="js">
	import { Buffer } from 'buffer';
	// @ts-ignore
	globalThis.Buffer = Buffer;
</script> -->

<script>
		import '../tailwind.css';
	import Nav from '../components/Nav.svelte';
	import { MY_TWITTER_HANDLE, MY_YOUTUBE, REPO_URL, SITE_TITLE } from '$lib/siteConfig';
	import { clusterApiUrl } from '@solana/web3.js';
	import { WalletProvider, ConnectionProvider } from '@svelte-on-solana/wallet-adapter-ui';
	import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
	import { getLocalStorage } from '@svelte-on-solana/wallet-adapter-core';
	import { AnchorConnectionProvider } from '@svelte-on-solana/wallet-adapter-anchor';
	import idl from '../anchor/vote_test.json'
	import { browser } from '$app/environment';
	import {
		PhantomWalletAdapter,
		GlowWalletAdapter,
		BackpackWalletAdapter,
		SolflareWalletAdapter,
		SolletExtensionWalletAdapter,
		SolletWalletAdapter,
		TorusWalletAdapter,
	} from '@solana/wallet-adapter-wallets';
	const localStorageKey = 'walletAdapter';
	const endpoint = WalletAdapterNetwork.Devnet;
	const network = clusterApiUrl(WalletAdapterNetwork.Devnet);
	let wallets = [
		new PhantomWalletAdapter(),
		new GlowWalletAdapter(),
		new BackpackWalletAdapter(),
		new SolflareWalletAdapter(),
		new SolletWalletAdapter({ network: endpoint }),
		new SolletExtensionWalletAdapter({ network: endpoint }),
		new TorusWalletAdapter(),
	];
	$: autoConnect = browser && Boolean(getLocalStorage('autoconnect', false));
</script>

<svelte:head>
</svelte:head>

<WalletProvider {localStorageKey} {wallets} {autoConnect} />
<ConnectionProvider {network} />
<AnchorConnectionProvider {network} {idl} />
<div class="flex flex-col justify-center bg-gray-50 px-4 dark:bg-gray-900 sm:px-8">
	<Nav />
</div>
<main class="flex flex-col justify-center bg-gray-50 px-4 dark:bg-gray-900 sm:px-8">
	<slot />
</main>

<footer class="mx-auto mb-8 flex w-full max-w-2xl flex-col items-start justify-center">
	<hr class="border-1 mb-8 w-full border-gray-200 dark:border-gray-800" />
	<div class="grid w-full max-w-2xl grid-cols-1 gap-4 px-4 pb-16 sm:grid-cols-2 sm:px-8">
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
</footer>
