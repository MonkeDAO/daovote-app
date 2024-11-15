<script lang="ts">
	import {
		type Connection,
		PublicKey,
		Transaction,
		type TransactionInstruction
	} from '@solana/web3.js';
	import {
		createCreateDelegateInstruction,
		createRemoveDelegateAddressInstruction,
		createAddDelegateAddressInstruction
	} from '$lib/anchor/instructions';
	import { walletProgramConnection } from '$lib/wallet';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace } from '@svelte-on-solana/wallet-adapter-anchor';
	import type { DelegateAccount } from '$lib/anchor/accounts';
	import { message } from '$lib/stores/messageStore';
	import { loading as loadingStore } from '$lib/stores/loadingStore';
	import type { Program } from '@project-serum/anchor';
	import type { Adapter } from '@solana/wallet-adapter-base';
	import { web3 } from '@project-serum/anchor';
	import { toast } from '@zerodevx/svelte-toast';
	import {
		SYSTEM_PROGRAM_ID,
		TREASURY_ADDRESS,
		delegateAccountPda,
		extractCustomCodes,
		getEnvNetwork,
		isValidSolAddress,
		getDelegateAccount,
		sleep,
		trimAddress
	} from '$lib/utils/solana';
	import type { DelegateAccountType } from '$lib/types';
	import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
	import { goto } from '$app/navigation';
	import Fa from 'svelte-fa';
	import { faCopy, faWarning, faCancel, faAdd, faGear } from '@fortawesome/free-solid-svg-icons';
	import { isDark } from '$lib/stores/darkModeStore';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';

	let delegateAddresses = [{ id: 0, address: '' }];
	let delegateAddressPublickey: PublicKey | null;
	let data: {
		delegateAccount: DelegateAccount | null;
		delegateAccountAddress: string | null;
	} | null;
	let connection: Connection;
	let wallet: Adapter;
	let loading = false;
	let text = 'Loading...';
	let confirmationModal: any;
	let error = false;
	let owner: string;
	let ready: boolean;
	let currentUser: PublicKey;
	let program: Program;
	let isOwner: boolean;
	let isOwnerSigned: boolean;
	let isFetching = false;
	let generatedLink = '';
	let selectedAddressToRemove: PublicKey | null = null;

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
	$: if (currentUser) {
		fetchData(currentUser);
	}

	async function generateLink(address: string) {
		try {
			const response = await fetch('/api/generatelink', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ delegateAccountAddress: address })
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
	let tooltipMessage: string | null = null;

	function copyToClipboard() {
		if (!data || !data.delegateAccount) {
			return;
		}
		const el = document.createElement('textarea');
		el.value = generatedLink;
		document.body.appendChild(el);
		el.select();
		document.execCommand('copy');
		document.body.removeChild(el);

		tooltipMessage = 'Copied!';
		setTimeout(() => {
			tooltipMessage = null; // Reset the message after a delay
		}, 1500);
	}

	async function fetchData(currentUser: PublicKey) {
		isFetching = true;
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
			isFetching = false; // End fetch state
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

	$: if (
		data &&
		data.delegateAccount &&
		data.delegateAccount.accounts &&
		data.delegateAccount.accounts[0] &&
		currentUser
	) {
		isOwnerSigned = data.delegateAccount.accounts[0].signed;
		delegateAddressPublickey = data.delegateAccount.accounts[0].address;
	}

	const removeAccountAddress = async (addressToRemove: PublicKey) => {
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
				address: addressToRemove
			}
		);
		await processTransaction(ix);
		await fetchData(currentUser);
	};

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
		} catch (err) {
			console.error('Error processing transaction:', err);
		} finally {
			reset();
		}
	};

	const createDelegate = async () => {
		const validAddresses = delegateAddresses.filter((address) => 
			isValidSolAddress(address.address)
		);
		
		if (validAddresses.length === 0) {
			toast.push('Please enter at least one valid address');
			return;
		}

		const mappedAddresses = validAddresses.map((address) => ({
			address: new PublicKey(address.address),
			signed: false
		}));

		loadingStore.set(true);
		loading = true;
		let ix;
		const [delegateAccountAddress, _] = delegateAccountPda(currentUser);

		try {
			if (data?.delegateAccount) {
				// Create array of instructions for multiple addresses
				const instructions = mappedAddresses.map(addr => 
					createAddDelegateAddressInstruction(
						{
							delegateAccount: new web3.PublicKey(delegateAccountAddress),
							signer: currentUser,
							systemProgram: web3.SystemProgram.programId,
							treasury: TREASURY_ADDRESS
						},
						{
							address: addr.address
						}
					)
				);
				ix = instructions;
			} else {
				ix = createCreateDelegateInstruction(
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
			}

			await processTransaction(ix);
			// Reset form state
			delegateAddresses = [{ id: 0, address: '' }];
			loading = false;
			// Refresh data
			await fetchData(currentUser);
			// Show success message
			toast.push('Addresses added successfully!');
		} catch (error) {
			console.error('Error creating delegate:', error);
			toast.push('Failed to add addresses. Please try again.');
			loading = false;
		} finally {
			loadingStore.set(false);
		}
	};
	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			addDelegateAddress();
		}
	}
	function confirmAddress() {
		if (!isValidSolAddress(delegateAddresses[0].address)) {
				toast.push('Please enter a valid address');
				return;
		}
		confirmationModal.openModal();
	}
	async function handleConfirm(event: CustomEvent<any>) {
		confirmationModal.closeModal();
		await createDelegate();
	}
	function reset() {
		loadingStore.set(false);
		message.set('');
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
</script>

<LoadingOverlay />
<ConfirmationModal
	data={delegateAddresses[0].address}
	bind:this={confirmationModal}
	message="This will allow {trimAddress(currentUser?.toBase58())} to vote on proposals with the voting power of {delegateAddresses[0].address}. Are you sure you want to continue?"
	eventOnConfirm="confirm"
	on:confirm={handleConfirm}
/>

<div class="container mx-auto px-4 sm:px-6 lg:px-8">
	<div class="py-5">
		<div class="mx-auto max-w-md text-base-content">
			<h3 class="text-2xl font-bold leading-relaxed">What is delegation?</h3>
			<p>
				Delegation is a process by which you can give the voting power of your ledger or wallet with
				SMB Gen2 in it to a different wallet.
			</p>
			<div class="mb-8 mt-8 flex hidden items-center justify-center md:block">
				{#if $isDark}
					<img src="/dark-delegate.png" alt="delegation" class="bg-transparent" />
				{:else}
					<img src="/delegate.png" alt="delegation" class="bg-transparent" />
				{/if}
			</div>
			<h3 class="mt-5 text-2xl font-bold leading-relaxed">Why delegate?</h3>
			<p>
				If you don't want to connect the wallet with your monke in it regularly to vote or don't
				want to break out your ledger, delegation is the way to go.
			</p>
			<h3 class="mt-8 text-2xl font-bold leading-relaxed">How delegate?</h3>
			<p>
				Request delegation permissions using the wallet you intend to vote from by entering the
				wallet address with your monke into the form. You then use a special generated link to
				approve delegation for the voting wallet wallet using the wallet your monke is in. You can
				remove and replace the address at any time.
			</p>
			<h3 class="mt-8 text-2xl font-bold leading-relaxed">Which wallet do I use?</h3>
			<p>
				You should use the wallet you intend to vote from on this site (burner or hot wallet). Your
				monke wallet should only be used to approve delegation requests.
			</p>
			<div class="mb-8 mt-8 flex hidden items-center justify-center md:block">
				{#if $isDark}
					<img src="/dark-steps.png" alt="delegation" class="bg-transparent" />
				{:else}
					<img src="/steps.png" alt="delegation" class="bg-transparent" />
				{/if}
			</div>
		</div>
		{#if isFetching}
			<!-- Display a loading indicator while fetching data -->
			<div class="fixed inset-0 flex items-center justify-center">
				<div class="h-16 w-16 animate-spin rounded-full border-t-4 border-solid border-blue-500" />
			</div>
		{:else if !isFetching && !delegateAddressPublickey && currentUser}
			<!-- Render the "Create Delegate Account" view -->

			<div class="mx-auto max-w-3xl overflow-hidden bg-white p-6 shadow sm:rounded-lg">
				<h1 class="text-2xl font-semibold text-gray-900">Delegate Vote</h1>
				<p class="italic text-gray-600">
					<strong>Connected wallet ({currentUser?.toString().slice(0,5)}...{currentUser?.toString().slice(-5)})</strong> will be used to vote with NFTs the address you enter below owns.
				</p>
				{#if data?.delegateAccountAddress}
					<div class="alert alert-warning mt-4">
						<Fa icon={faWarning} class="ml-1" />
						<span>Delegation is enabled but no addresses added yet. Add an address below.</span>
					</div>
				{/if}
				<div class="flex h-full flex-col justify-between">
					<div class="mt-5">
						<label for="delegateAddresses" class="leading-loose text-gray-900">
							Enter Wallet Addresses with SMB Gen2
						</label>
						{#each delegateAddresses as delegateAddress (delegateAddress.id)}
							<div class="flex items-center space-x-2">
								<input
									type="text"
									bind:value={delegateAddress.address}
									class="custom-input max-ws-xs input-primary input mt-1 block w-full rounded"
									placeholder="Address"
									required
									on:keypress={(event) => handleKeyPress(event)}
								/>
								{#if delegateAddresses.length > 1}
									<button
										type="button"
										class="btn-primary btn-square btn-sm btn"
										on:click={() => removeDelegateAddress(delegateAddress.id)}
										style="padding: 4px;"
									>
										<Fa icon={faCancel} />
									</button>
								{/if}
							</div>
						{/each}
						{#if delegateAddresses.length < 5}
							<button
								type="button"
								class="btn-primary btn-square btn-sm btn mt-2"
								on:click={addDelegateAddress}
								style="padding: 4px;"
							>
								<Fa icon={faAdd} />
							</button>
						{/if}
					</div>
					<button class="btn-primary btn self-end text-gray-900" on:click={confirmAddress}
						>{#if loading}<span class="loading loading-spinner" />{/if}Transfer Vote Power</button
					>
				</div>
			</div>
		{:else if !isFetching && data && data.delegateAccount}
			<!-- Render the "Manage Delegate Account" view -->
			<div class="mx-auto mb-5 max-w-3xl overflow-hidden bg-white p-6 shadow sm:rounded-lg">
				<h1 class="text-2xl font-semibold text-gray-900">Delegation Details</h1>
				{#if data.delegateAccount.accounts.length > 0}
					<div class="flex h-full flex-col justify-between">
						<p class="text-md font-semibold mt-5 text-gray-900">
							Wallet with Voting Power: <em class="italic">
								<span class="font-normal">{owner}</span>
							</em>
						</p>
						<p class="text-sm text-gray-600">This is the address you can cast votes from.</p>
						
						<div class="mt-4">
							<p class="text-md font-semibold text-gray-900 mb-2">Wallets with SMB Gen2 NFTs:</p>
							{#each data.delegateAccount.accounts as account}
								<div class="flex items-center justify-between mt-2">
									<span class="font-normal {account.signed ? 'text-green-500' : 'text-red-500'}">
										{account.address.toString()}
									</span>
									<button
										class="btn-error btn-sm btn ml-2"
										on:click={() => removeAccountAddress(account.address)}
									>
										<Fa icon={faCancel} />
										Remove
									</button>
								</div>
							{/each}
							<p class="mt-2 text-sm text-gray-600">
								These are the addresses with your SMB Gen2 NFTs (usually ledger or cold wallets).
							</p>
						</div>
						
						<div class="mb-2 flex">
							{#if data.delegateAccount.accounts.some(account => account.signed)}
								<div class="flex items-center text-sm text-gray-600">
									<span class="mr-1 inline-block h-4 w-4 rounded-full bg-green-500" />
									<em class="italic">Active</em>
									{#if data.delegateAccount.accounts.some(account => !account.signed)}
										<span class="ml-2 text-amber-500">
											(Some addresses still need to sign)
										</span>
									{/if}
								</div>
							{:else}
								<div class="mr-6 flex items-center text-sm text-gray-600">
									<span class="mr-1 inline-block h-4 w-4 rounded-full bg-red-500" />
									<em class="italic">Not Active</em>
								</div>
							{/if}
						</div>
						{#if data.delegateAccount.accounts.some(account => !account.signed)}
							<div class="mb-2">
								<div class="alert alert-warning mb-4">
									<Fa icon={faWarning} class="ml-1" />
									<span>
										Some delegate addresses still need to complete the signing process.
									</span>
								</div>
								<ul class="steps">
									<li data-content="✓" class="step-primary step text-black">
										{data.delegateAccount.accounts.length > 1 ? 'Addresses' : 'Address'} Added
									</li>
									<li data-content="1" class="step text-black">Go to copied sign link</li>
									<li data-content="2" class="step text-black">
										Connect with {#if data.delegateAccount.accounts.length > 1}each address{:else}{trimAddress(data.delegateAccount.accounts[0].address.toBase58())}{/if}
									</li>
									<li data-content="3" class="step text-black">Sign to enable vote power</li>
								</ul>
							</div>
						{/if}
						<div class="mt-5 flex items-end justify-end space-x-4">
							<div class="tooltip ml-2" data-tip={tooltipMessage}>
								<button class="btn-primary btn-md btn self-end" on:click={() => copyToClipboard()}>
									<Fa class="ml-2" icon={faCopy} />
									Generate Sign Link
								</button>
							</div>
							{#if data.delegateAccount.accounts.length > 0}
								<button 
									class="btn-secondary btn-md btn self-end"
									on:click={() => goto('/delegate/manage')}
								>
									<Fa class="mr-2" icon={faAdd} />
									Manage Addresses
								</button>
							{/if}
						</div>
					</div>
				{:else}
					<p class="text-gray-900">Delegation is enabled but no addresses added yet.</p>
				{/if}
			</div>
		{:else if !isFetching && !currentUser}
			<div class="mx-auto max-w-3xl overflow-hidden bg-white p-6 shadow sm:rounded-lg">
				<h1 class="text-2xl font-semibold text-gray-900">Please Connect Wallet</h1>
				<p class="mt-2 text-gray-600">Remember to connect the wallet you want to use on this site to vote with.</p>
			</div>
		{/if}
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
		background-color: bg-primary;
	}
	.btn-primary {
		background-color: bg-primary;
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
	.custom-input {
		@apply bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500;
	}
</style>
