<script lang="ts">
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { type Connection, PublicKey, Transaction } from '@solana/web3.js';
	import { createCreateDelegateInstruction } from '$lib/anchor/instructions';
	import { walletProgramConnection } from '$lib/wallet';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace } from '@svelte-on-solana/wallet-adapter-anchor';
	import type { DelegateAccount } from '$lib/anchor/accounts';
    import { message } from '$lib/stores/messageStore';
    import { loading as loadingStore } from '$lib/stores/loadingStore';
	import type { Program } from '@project-serum/anchor';
	import type { Adapter } from '@solana/wallet-adapter-base';
    import { toast } from '@zerodevx/svelte-toast';
	import {
		SYSTEM_PROGRAM_ID,
		TREASURY_ADDRESS,
		delegateAccountPda,
		extractCustomCodes,
		getDelegateAccountType,

		isValidSolAddress

	} from '$lib/utils/solana';
	import type { DelegateAccountType } from '$lib/types';
	import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
	import { faCancel } from '@fortawesome/free-solid-svg-icons';
	import Fa from 'svelte-fa';

	let delegateAddresses = [{ id: 0, address: '' }];

	let delegateAccount: DelegateAccountType;
	let delegateAccountAddress: PublicKey;
	let connection: Connection;
	let wallet: Adapter;
	let loading = true;
	let text = 'Loading...';
	let error = false;
	let ready: boolean;
	let currentUser: PublicKey;
	let program: Program;
	let isOwner: boolean;
	const walletConnectionFactory = walletProgramConnection(walletStore, workSpace);
	$: {
		ready = $walletConnectionFactory.ready;
		if (ready && $walletConnectionFactory.connection) {
			connection = $walletConnectionFactory.connection;
		}
		if (ready && $walletConnectionFactory.wallet) {
			wallet = $walletConnectionFactory.wallet;
		}
		if (ready && $walletConnectionFactory.program) {
			program = $walletConnectionFactory.program;
		}
		if (ready && $walletConnectionFactory.publicKey) {
			currentUser = $walletConnectionFactory.publicKey;
		}
	}

	const addDelegateAddress = () => {
		if (delegateAddresses.length < 5) {
        const newAddressID = delegateAddresses.length;
        delegateAddresses = [...delegateAddresses, { id: newAddressID, address: '' }];
        } else {
            toast.push("Maximum of 5 addresses reached");
        }
	};

	const removeDelegateAddress = (addressID: number) => {
		if (delegateAddresses.length === 1) {
			return;
		}
		delegateAddresses = delegateAddresses.filter((address) => address.id !== addressID);
	};

	const createDelegate = async () => {
        const validAddresses = delegateAddresses.filter((address) => isValidSolAddress(address.address));
		const mappedAddresses = validAddresses.map((address) => {
			return {
				address: new PublicKey(address.address),
				signed: false
			};
		});
        //if mappedaddresses is empty, return
        if (mappedAddresses.length === 0) {
            toast.push("No valid addresses");
            return;
        }
        loadingStore.set(true);
		const [delegateAccountAddress, _] = delegateAccountPda(currentUser);
		const ix = createCreateDelegateInstruction(
			{
				delegate: delegateAccountAddress,
				delegator: currentUser,
				treasury: TREASURY_ADDRESS,
				systemProgram: SYSTEM_PROGRAM_ID
			},
			{
				delegateAddresses: mappedAddresses
			}
		);
		const tx = new Transaction().add(ix);
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

			console.log('Signature', signature);
			const latestBlockhash = await connection.getLatestBlockhash();

			await connection.confirmTransaction(
				{
					signature: signature,
					lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
					blockhash: latestBlockhash.blockhash
				},
				'confirmed'
			);
            reset();
	};
	function reset() {
		loadingStore.set(false);
		message.set('');
	}
</script>

<LoadingOverlay />
<div class="container mx-auto px-4 sm:px-6 lg:px-8">
	<div class="py-5">
		<div class="bg-white shadow overflow-hidden sm:rounded-lg max-w-3xl mx-auto p-6">
			<h1 class="text-2xl font-semibold text-gray-900">Create Delegate Account</h1>
			<div class="mt-5">
				<label for="delegateAddresses" class="leading-loose text-gray-900">Delegate Addresses</label>
				{#each delegateAddresses as delegateAddress (delegateAddress.id)}
					<div class="flex items-center space-x-2">
						<input
							type="text"
							bind:value={delegateAddress.address}
							class="form-input mt-1 block w-full rounded-md text-gray-900"
							placeholder="Enter Delegate Address"
							required
						/>
                        <button
								type="button"
								class="btn-square btn-sm btn"
								on:click={() => removeDelegateAddress(delegateAddress.id)}
							>
								<Fa icon={faCancel} />
							</button>
					</div>
				{/each}
				<button type="button" class="btn-primary btn-sm btn mt-2 text-gray-900" on:click={addDelegateAddress}>Add Address</button>
			</div>
			<div class="mt-5">
				<button class="btn-primary btn text-gray-900" on:click={createDelegate}>Create Delegate</button>
			</div>
		</div>
	</div>
</div>

<style lang="postcss">
	.container {
		max-width: 100%;
		margin: 0 auto;
		padding: 0 1rem;
	}
	@media (min-width: 640px) {
		.container {
			max-width: 640px;
		}
	}
	@media (min-width: 768px) {
		.container {
			max-width: 768px;
		}
	}
	@media (min-width: 1024px) {
		.container {
			max-width: 1024px;
		}
	}
	@media (min-width: 1280px) {
		.container {
			max-width: 1280px;
		}
	}
    button {
		border: none;
		padding: 8px;
		border-radius: 5px;
		font-size: 16px;
		cursor: pointer;
		color: white;
		background-color: #4e44ce;
	}
	.btn-primary {
		background-color: #4e44ce;
		color: white;
		border-radius: 5px;
		padding: 8px;
		font-size: 16px;
		cursor: pointer;
		border: none;
	}
	.btn-sm {
		padding: 4px 8px;
		font-size: 14px;
	}
	.form-input {
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		padding: 0.5rem 0.75rem;
		font-size: 1rem;
		line-height: 1.5;
	}
	.form-input:focus {
		border-color: #4e44ce;
		outline: none;
		box-shadow: 0 0 3px rgba(78, 68, 206, 0.5);
	}
</style>