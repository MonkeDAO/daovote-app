<script lang="ts">
	import type { DelegateAccount } from '$lib/anchor/accounts';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { walletProgramConnection } from '$lib/wallet';
	import { web3 } from '@project-serum/anchor';
	import { toast } from '@zerodevx/svelte-toast';
	import { loading as loadingStore } from '$lib/stores/loadingStore';
	import { message } from '$lib/stores/messageStore';
	import {
		TREASURY_ADDRESS,
		extractCustomCodes,
		getDelegateAccount,
		getEnvNetwork,
		isValidSolAddress,
		sleep
	} from '$lib/utils/solana';
	import { workSpace } from '@svelte-on-solana/wallet-adapter-anchor';
	import { PublicKey, type Connection, type TransactionInstruction } from '@solana/web3.js';
	import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
	import Fa from 'svelte-fa';
	import { faCancel, faAdd, faShare } from '@fortawesome/free-solid-svg-icons';
	import { createAddDelegateAddressInstruction } from '$lib/anchor/instructions/addDelegateAddress';
	import { createRemoveDelegateAddressInstruction } from '$lib/anchor/instructions';

	let data: {
		delegateAccount: DelegateAccount | null;
		delegateAccountAddress: string | null;
	} | null;
	let connection: Connection;
	let currentUser: PublicKey;
	let isOwner: boolean;
	let isOwnerSigned: boolean;
	let owner: string;
	let loading = false;
	let ready: boolean;
	const walletConnectionFactory = walletProgramConnection(walletStore, workSpace);
	let delegateAddresses = [{ id: 0, address: '' }];
    let generatedLink = '';

    async function generateLink(address: string) {
    try {
        const response = await fetch('/api/generatelink', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ delegateAccountAddress: address }),
        });

        if (!response.ok) {
            throw new Error('Failed to generate the link.');
        }

        const { link } = await response.json();
        generatedLink = link;

    } catch (error) {
        console.error('Error generating link:', error);
    }
}
	$: {
		ready = $walletConnectionFactory.ready;
		if (ready && $walletConnectionFactory.connection) {
			connection = $walletConnectionFactory.connection;
		}
		if (ready && $walletConnectionFactory.publicKey) {
			currentUser = $walletConnectionFactory.publicKey;
		}
	}
	$: if (currentUser) {
		fetchData(currentUser);
	}

	async function fetchData(currentUser: PublicKey) {
		loading = true;
		const connection = getEnvNetwork();

		try {
			if (!isValidSolAddress(currentUser.toString())) {
				console.error('Delegate account address is invalid');
				data = null;
				return;
			}

			const delegateAccountRaw = await getDelegateAccount(currentUser, connection);
			data = {
				delegateAccount: delegateAccountRaw?.delegateAccount || null,
				delegateAccountAddress: delegateAccountRaw?.address?.toBase58() || null
			};
		} catch (error) {
			console.error('Error fetching data:', error);
			data = null;
		} finally {
			loading = false; // End loading state
		}
	}
    $: if (data && data.delegateAccountAddress) {
        generateLink(data.delegateAccountAddress);
    }
	$: if (data && data.delegateAccount && data.delegateAccount.accounts && currentUser) {
		isOwner = data.delegateAccount.delegateOwner.toBase58() === currentUser.toBase58();
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
		instruction: TransactionInstruction | TransactionInstruction[]
	) => {
		try {

		
		if (!data?.delegateAccountAddress) {
			return;
		}
		if (!isOwner) {
			toast.push('You are not the owner of this delegate account');
			return;
		}
		loadingStore.set(true);
		//push if its just a TransactionInstruction type otherwise push the array to the tx
		const tx = new web3.Transaction();
		if (Array.isArray(instruction)) {
			instruction.forEach((instr) => {
				tx.add(instr);
			});
		} else {
			tx.add(instruction);
		}

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
		await sleep(2000);
		reset();
		}
		catch(err) {
			console.error('Error processing transaction:', err);
		}
		finally {
			reset();
		}
	};

    let tooltipMessage = "Copy link to clipboard";

    function copyToClipboard() {
        if (!data || !data.delegateAccount) {
            return;
        }
        // Construct the full URL
        const rootUrl = window.location.origin; // This gives you the root URL like "https://example.com"
        const link = `${rootUrl}/delegate/sign/${data.delegateAccountAddress}`;

        const el = document.createElement('textarea');
        el.value = generatedLink;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);

        tooltipMessage = "Copied!";
        setTimeout(() => {
            tooltipMessage = "Copy link to clipboard"; // Reset the message after a delay
        }, 1500);
    }

	const addDelegateAccounts = async () => {
		if (!data?.delegateAccountAddress) {
			return;
		}
		const validAddresses = delegateAddresses.filter((address) =>
			isValidSolAddress(address.address)
		);
		const mappedAddresses = validAddresses.map((address) => ({
			address: new PublicKey(address.address),
			signed: false
		}));

		if (mappedAddresses.length === 0) {
			toast.push('No valid addresses');
			return;
		}

		let transactionIxs: TransactionInstruction[] = [];
		delegateAddresses.map((dAddress) => {
			if (data?.delegateAccountAddress && dAddress.address) {
				return transactionIxs.push(
					createAddDelegateAddressInstruction(
						{
							delegateAccount: new web3.PublicKey(data.delegateAccountAddress),
							signer: currentUser,
							systemProgram: web3.SystemProgram.programId,
							treasury: TREASURY_ADDRESS
						},
						{
							address: new PublicKey(dAddress.address)
						}
					)
				);
			}
		});
		await processTransaction(transactionIxs);
		await fetchData(currentUser);
		delegateAddresses = [{ id: 0, address: '' }];
	};

	const removeAccountAddress = async (address: PublicKey) => {
		if (!data?.delegateAccountAddress) {
			return;
		}
		const ix = createRemoveDelegateAddressInstruction(
			{
				delegateAccount: new web3.PublicKey(data.delegateAccountAddress),
				signer: currentUser,
				systemProgram: web3.SystemProgram.programId
			},
			{
				address
			}
		);
		await processTransaction(ix);
		await fetchData(currentUser);
	};

	function addOption() {
		const newOptionID = delegateAddresses.length;
		delegateAddresses = [...delegateAddresses, { id: newOptionID, address: '' }];
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			// If you want to add the new option when Enter key is pressed
			addOption();
		}
	}

	const addDelegateAddress = () => {
		if (delegateAddresses.length < 5) {
			const newAddressID = delegateAddresses.length;
			delegateAddresses = [...delegateAddresses, { id: newAddressID, address: '' }];
		} else {
			toast.push('Maximum of 5 addresses reached');
		}
	};

	const removeDelegateAddress = (addressID: number) => {
		if (delegateAddresses.length === 1) {
			return;
		}
		delegateAddresses = delegateAddresses.filter((address) => address.id !== addressID);
	};

	function reset() {
		loadingStore.set(false);
		message.set('');
	}
</script>

<LoadingOverlay />
<section class="container mx-auto px-6 py-7 sm:px-8 lg:px-10">
	<div class="mx-auto max-w-3xl bg-white p-8 shadow sm:rounded-lg">
		{#if !data || !data.delegateAccount}
        <div class="mb-5">
            <h2 class="text-2xl font-semibold text-gray-900">Not Found</h2>
            <p class="text-gray-900">
                No delegation account created for the connected wallet. 
                <button 
                    class="inline-flex items-center btn btn-outline btn-sm btn-info text-white px-2 py-1"
                    on:click={() => location.href='/delegate/create'}>
                    Create one!
                </button>
            </p>
        </div>
			{#if loading}
				<div class="fixed inset-0 flex items-center justify-center">
					<div
						class="h-16 w-16 animate-spin rounded-full border-t-4 border-solid border-blue-500"
					/>
				</div>
			{/if}
		{/if}
		{#if data && data.delegateAccount}
			<div class="mb-5">
				<h2 class="text-2xl font-semibold text-gray-900">Owner: {owner}</h2>
				<p class="text-sm text-gray-600">
					The owner address will be allowed to vote with any of the addresses below that approved
					delegation.
				</p>
			</div>
			<div class="mx-auto overflow-x-auto">
                {#if data.delegateAccount.accounts.length > 0}
				<table class="table-md mx-auto table max-w-xl">
					<thead>
						<tr>
							<th class="bg-primary/100">Address</th>
							<th class="bg-primary/100">Status</th>
						</tr>
					</thead>
					<tbody>
						{#each data.delegateAccount.accounts as account (account.address)}
							<tr>
								<td class="bg-primary/80">{account.address}</td>
								<td class="bg-primary/80">
									<div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
										{#if account.signed}
    <div class="badge-success badge">Signed</div>
{:else}
    <div class="badge-error badge whitespace-nowrap">Missing Signer</div>
{/if}
										<button
											type="button"
											class="btn-primary btn-square btn-sm btn"
											on:click={() => removeAccountAddress(account.address)}
										>
											<Fa icon={faCancel} />
										</button>
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
			{#if data && data.delegateAccount.accounts.length < 5}
				<div class="flex h-full flex-col justify-between">
					<div class="mt-5">
						<label for="delegateAddresses" class="leading-loose text-gray-900"
							>Add delegate addresses</label
						>
						{#each delegateAddresses as delegateAddress (delegateAddress.id)}
							<div class="flex items-center space-x-2">
								<input
									type="text"
									bind:value={delegateAddress.address}
									class="custom-input max-ws-xs input-primary input mt-1 block w-full rounded"
									placeholder=" Address"
									required
									on:keypress={(event) => handleKeyPress(event)}
								/>
								<button
									type="button"
									class="btn-primary btn-square btn-sm btn"
									on:click={() => removeDelegateAddress(delegateAddress.id)}
									style="padding: 4px;"
								>
									<Fa icon={faCancel} />
								</button>
							</div>
						{/each}
						<button
							type="button"
							class="btn-primary btn-square btn-sm btn mt-2"
							on:click={addDelegateAddress}
							style="padding: 4px;"
						>
							<Fa icon={faAdd} />
						</button>
					</div>
					<div class="flex justify-end space-x-2 mt-5">
                        <button
                            type="button"
                            class="btn-primary btn-md btn py-2 text-gray-100 self-end"
                            disabled={delegateAddresses.length === 0 ||
                                delegateAddresses.length > 5 ||
                                delegateAddresses.some((address) => !isValidSolAddress(address.address))}
                            on:click={() => addDelegateAccounts()}
                        >
                            {delegateAddresses.length > 1 && delegateAddresses.every(x => x.address) ? `Add ${delegateAddresses.length} Accounts` : 'Add Account'}
                        </button>
    
                        <!-- Share button to copy link to clipboard -->
                        <div class="tooltip" data-tip={tooltipMessage}>
                            <button
                                class="btn-primary btn-md btn self-end"
                                on:click={() => copyToClipboard()}
                            >
                                <Fa class="mr-2" icon={faShare} />
                                Generate Sign Link
                            </button>
                        </div>
                    </div>
				</div>
			{/if}
		{/if}
	</div>
</section>

<style lang="postcss">
	.custom-input {
		@apply bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500;
	}
</style>
