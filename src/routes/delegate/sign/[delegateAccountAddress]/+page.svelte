<script lang="ts">
	import type { DelegateAccount } from '$lib/anchor/accounts';
	import { createSignDelegateAddressInstruction } from '$lib/anchor/instructions/signDelegateAddress';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { walletProgramConnection } from '$lib/wallet';
	import { web3 } from '@project-serum/anchor';
	import { toast } from '@zerodevx/svelte-toast';
	import { loading as loadingStore } from '$lib/stores/loadingStore';
	import { message } from '$lib/stores/messageStore';
	import { extractCustomCodes, sleep } from '$lib/utils/solana';
	import { workSpace } from '@svelte-on-solana/wallet-adapter-anchor';
	import type { Adapter } from '@solana/wallet-adapter-base';
	import type { Connection, PublicKey } from '@solana/web3.js';
	import { createRevokeDelegateAddressInstruction } from '$lib/anchor/instructions/revokeDelegateAddress';
	import { faPenFancy, faSignOut, faCopy, faBookmark } from '@fortawesome/free-solid-svg-icons';
	import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
	import { goto } from '$app/navigation';
	import Fa from 'svelte-fa';
	import { page } from '$app/stores';

	export let data: {
		delegateAccount: DelegateAccount | null;
		delegateAccountAddress: string | null;
		signature: string | null;
	};
	let connection: Connection;
	let currentUser: PublicKey;
	let isOwner: boolean;
	let isOwnerSigned: boolean;
	let owner: string;
	let loading = true;
	let ready: boolean;
	let tooltipMessage = 'Copy';
	const walletConnectionFactory = walletProgramConnection(walletStore, workSpace);

	$: {
		ready = $walletConnectionFactory.ready;
		if (ready && $walletConnectionFactory.connection) {
			connection = $walletConnectionFactory.connection;
		}
		if (ready && $walletConnectionFactory.wallet) {
		}
		if (ready && $walletConnectionFactory.program) {
		}
		if (ready && $walletConnectionFactory.publicKey) {
			currentUser = $walletConnectionFactory.publicKey;
		}
	}

	$: if (data && data.delegateAccount && data.delegateAccount.accounts && currentUser) {
		isOwner = data.delegateAccount.accounts.some(
			(account) => account.address.toBase58() === currentUser.toBase58()
		);
		loading = false;
	}
	$: if (data && data.delegateAccount && data.delegateAccount.delegateOwner) {
		owner = data.delegateAccount.delegateOwner.toString();
	}

	$: if (data && data.delegateAccount && data.delegateAccount.accounts && currentUser) {
		isOwnerSigned = data.delegateAccount.accounts.some(
			(account) => account.address.toBase58() === currentUser.toBase58() && account.signed
		);
	}

	const processTransaction = async (
		instructionCreator: (args: {
			delegateAccount: web3.PublicKey;
			signer: PublicKey;
			systemProgram: PublicKey;
		}) => web3.TransactionInstruction
	) => {
		if (!data.delegateAccountAddress) {
			return;
		}
		if (!isOwner) {
			toast.push('You are not the owner of this delegate account');
			return;
		}
		try {
			loadingStore.set(true);
			const ix = instructionCreator({
				delegateAccount: new web3.PublicKey(data.delegateAccountAddress),
				signer: currentUser,
				systemProgram: web3.SystemProgram.programId
			});
			const tx = new web3.Transaction().add(ix);
			tx.feePayer = currentUser;
			tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
			message.set('Simulating transaction...');
			const t = await connection.simulateTransaction(tx);
			if (t.value.err) {
				const messages = extractCustomCodes(t.value.err);
				if (messages.length > 0) {
					const msgString = messages.join(', ');
					message.set(`Error: ${msgString}`);
					setTimeout(() => {
						reset();
					}, 2000);
					return;
				}
			}
			message.set('Waiting for signature...');
			const signature = await $walletStore.sendTransaction(tx, connection);
			const latestBlockhash = await connection.getLatestBlockhash();

			await connection.confirmTransaction(
				{
					signature: signature,
					lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
					blockhash: latestBlockhash.blockhash
				},
				'confirmed'
			);
			message.set('Success!');
		} catch (e) {
			message.set(`${(e as any)?.message ?? 'Error! Please try again'}`);
		} finally {
			await sleep(2000);
			reset();
			goto(`/delegate/sign/${data.delegateAccountAddress}?signature=${data.signature}`, {
				replaceState: true,
				invalidateAll: true
			});
		}
	};

	const signDelegateAccount = async () => {
		await processTransaction(createSignDelegateAddressInstruction);
	};

	const revokeDelegateAddress = async () => {
		await processTransaction(createRevokeDelegateAddressInstruction);
	};

	function copyToClipboard(text: string) {
		const el = document.createElement('textarea');
		el.value = text;
		document.body.appendChild(el);
		el.select();
		document.execCommand('copy');
		document.body.removeChild(el);
		tooltipMessage = 'Copied!';
		setTimeout(() => {
			tooltipMessage = 'Copy to clipboard'; // Reset the message after a delay
		}, 1500);
	}

	function reset() {
		loadingStore.set(false);
		message.set('');
	}
</script>

<LoadingOverlay />
<section class="container mx-auto px-6 py-7 sm:px-8 lg:px-10">
	<div class="mx-auto max-w-3xl bg-accent-light p-8 shadow sm:rounded-lg dark:bg-brand-dark">
		{#if !data || !data.delegateAccount}
			<div class="mb-5">
				<h2 class="text-2xl font-semibold text-brand-dark dark:text-accent-light">Not Found</h2>
				<p class="text-secondary dark:text-accent">{$page.data?.error || 'No delegate account found.'}</p>
			</div>
		{/if}
		{#if data && data.delegateAccount}
			<div class="mb-5">
				<h2 class="mb-3 text-2xl font-semibold text-brand-dark dark:text-accent-light">Delegation</h2>
				<div class="alert alert-warning mb-3 bg-accent text-secondary-dark dark:bg-secondary dark:text-accent-light">
					<Fa icon={faBookmark} class="ml-1" />
					<span>Bookmark this link to revoke access incase your hot wallet is compromised.</span>
				</div>
				<div class="mt-2 flex items-center">
					<h3 class="text-xl text-gray-800">{owner}</h3>
					<div class="tooltip ml-2" data-tip={tooltipMessage}>
						<button
							class="btn-ghost btn-sm btn text-gray-900 focus:outline-none"
							on:click={() => copyToClipboard(owner)}
						>
							<Fa icon={faCopy} class="text-gray-600 hover:text-gray-800" />
						</button>
					</div>
				</div>
				<p class="mt-2 text-sm text-gray-600">
					This address will have voting power from all SMB Gen2 NFTs present in the below address
					once signed.
				</p>
			</div>
			<div class="mx-auto overflow-x-auto">
				{#if data.delegateAccount.accounts.length > 0}
					<table class="table-md mx-auto table max-w-xl text-gray-600">
						<thead>
							<tr>
								<th class="bg-gray-200 text-gray-500">Address</th>
								<th class="bg-gray-200 text-gray-500">Status</th>
							</tr>
						</thead>
						<tbody>
							{#each data.delegateAccount.accounts as account (account.address)}
								<tr class="">
									<td class="bg-gray-300">{account.address}</td>
									<td class="bg-gray-300">
										<div class="flex items-start text-sm text-gray-600 dark:text-gray-400">
											{#if account.signed}
												<div class="badge badge-success">Signed</div>
											{:else}
												<div class="badge badge-error">Missing Signer</div>
											{/if}
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{:else}
					<p class="text-gray-900">Delegation is enabled but no addresses added yet.</p>
				{/if}
			</div>
			{#if isOwner}
				<div class="mt-5 flex items-end justify-end space-x-4">
					<button
						class="btn-primary btn-md btn flex items-center text-gray-100"
						on:click={signDelegateAccount}
						disabled={!isOwner || loading || isOwnerSigned}
					>
						<Fa icon={faPenFancy} class="ml-1 mr-2" />
						{isOwnerSigned ? 'Signed' : 'Sign to approve'}
					</button>

					<button
						class="btn-error btn-md btn flex items-center text-gray-100"
						on:click={revokeDelegateAddress}
						disabled={!isOwner || loading || !isOwnerSigned}
					>
						<Fa icon={faSignOut} class="ml-1 mr-2" />
						{isOwnerSigned ? 'Revoke' : 'Revoked'}
					</button>
				</div>
			{/if}
			{#if !isOwner}
				<p class="relative mt-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
					The wallet connected cannot sign for any of these addresses. Please connect the wallet
					that owns one of these addresses to approve delegation
				</p>
			{/if}
		{/if}
	</div>
</section>
