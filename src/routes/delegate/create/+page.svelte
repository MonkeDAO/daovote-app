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
	import { faCopy, faWarning } from '@fortawesome/free-solid-svg-icons';
	import { isDark } from '$lib/stores/darkModeStore';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';

	let delegateAddresses: { id: number; address: string }[] = [{ id: 0, address: '' }];
	let newDelegateAddress = ''; // For adding to existing account
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

	// Check if any of the delegate addresses are signed
	$: if (data && data.delegateAccount && data.delegateAccount.accounts && currentUser) {
		isOwnerSigned = data.delegateAccount.accounts.some((account) => account.signed);
	}

	// Calculate how many addresses can still be added (max 5)
	$: existingAddressCount = data?.delegateAccount?.accounts?.length ?? 0;
	$: canAddMoreAddresses = existingAddressCount < 5;
	$: remainingSlots = 5 - existingAddressCount;

	const removeAccountAddressByKey = async (addressToRemove: PublicKey) => {
		if (!data?.delegateAccountAddress || !addressToRemove) {
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
		// Filter valid addresses from the array
		const validAddresses = delegateAddresses.filter((addr) => isValidSolAddress(addr.address));
		if (validAddresses.length === 0) {
			toast.push('No valid addresses');
			return;
		}

		const mappedAddresses = validAddresses.map((addr) => ({
			address: new PublicKey(addr.address),
			signed: false
		}));

		loadingStore.set(true);
		loading = true;
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

		try {
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
			// Reset the addresses array
			delegateAddresses = [{ id: 0, address: '' }];
			// Refresh the data
			await fetchData(currentUser);
		} catch (e) {
			console.log(e);
			reset();
		} finally {
			loading = false;
		}
	};

	const addAddressToExistingAccount = async () => {
		if (!isValidSolAddress(newDelegateAddress)) {
			toast.push('Please enter a valid address');
			return;
		}
		if (!data?.delegateAccountAddress) {
			return;
		}
		if (!canAddMoreAddresses) {
			toast.push('Maximum of 5 addresses reached');
			return;
		}

		loadingStore.set(true);
		loading = true;
		const ix = createAddDelegateAddressInstruction(
			{
				delegateAccount: new web3.PublicKey(data.delegateAccountAddress),
				signer: currentUser,
				systemProgram: web3.SystemProgram.programId,
				treasury: TREASURY_ADDRESS
			},
			{
				address: new PublicKey(newDelegateAddress)
			}
		);

		try {
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
			newDelegateAddress = '';
			// Refresh the data
			await fetchData(currentUser);
		} catch (e) {
			console.log(e);
			reset();
		} finally {
			loading = false;
		}
	};
	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
		}
	}
	function confirmAddress() {
		const validAddresses = delegateAddresses.filter((addr) => isValidSolAddress(addr.address));
		if (validAddresses.length === 0) {
			toast.push('Please enter at least one valid address');
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
</script>

<LoadingOverlay />
<ConfirmationModal
	data={delegateAddresses
		.filter((addr) => isValidSolAddress(addr.address))
		.map((a) => a.address)
		.join(', ')}
	bind:this={confirmationModal}
	message="This will allow {trimAddress(
		currentUser?.toBase58()
	)} to vote on proposals with the voting power of {delegateAddresses.filter((addr) =>
		isValidSolAddress(addr.address)
	).length} address(es). Are you sure you want to continue?"
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
		{:else if !isFetching && (!data || !data.delegateAccount) && currentUser}
			<!-- Render the "Create Delegate Account" view -->

			<div class="mx-auto max-w-3xl overflow-hidden bg-white p-6 shadow sm:rounded-lg">
				<h1 class="text-2xl font-semibold text-gray-900">Delegate Vote</h1>
				<p class="italic text-gray-600">
					<strong
						>Connected wallet ({currentUser?.toString().slice(0, 5)}...{currentUser
							?.toString()
							.slice(-5)})</strong
					> will be used to vote with NFTs the addresses you enter below own.
				</p>
				<div class="flex h-full flex-col justify-between">
					<div class="mt-5">
						<label for="delegateAddresses" class="leading-loose text-gray-900"
							>Enter Wallet Addresses with SMB Gen2 (up to 5)</label
						>
						{#each delegateAddresses as delegateAddress (delegateAddress.id)}
							<div class="mb-2 flex items-center gap-2">
								<input
									type="text"
									bind:value={delegateAddress.address}
									class="custom-input input input-primary mt-1 block w-full rounded"
									placeholder="Enter Delegate Address"
									required
									on:keypress={(event) => handleKeyPress(event)}
								/>
								{#if delegateAddresses.length > 1}
									<button
										type="button"
										class="btn btn-ghost btn-sm mt-1 text-error hover:bg-error hover:text-white"
										on:click={() => removeDelegateAddress(delegateAddress.id)}
										title="Remove address"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											stroke-width="2"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
									</button>
								{/if}
							</div>
						{/each}
						{#if delegateAddresses.length < 5}
							<button
								type="button"
								class="btn btn-outline btn-sm mt-2"
								on:click={addDelegateAddress}
							>
								+ Add Another Address
							</button>
						{/if}
					</div>
					<div class="mt-5 flex justify-end">
						<button class="btn btn-primary text-gray-900" on:click={confirmAddress}
							>{#if loading}<span class="loading loading-spinner" />{/if}Transfer Vote Power</button
						>
					</div>
				</div>
			</div>
		{:else if !isFetching && data && data.delegateAccount}
			<!-- Render the "Manage Delegate Account" view -->
			<div class="mx-auto mb-5 max-w-3xl overflow-hidden bg-white p-6 shadow sm:rounded-lg">
				<h1 class="text-2xl font-semibold text-gray-900">Delegation Details</h1>
				<div class="flex h-full flex-col justify-between">
					<p class="text-md mt-3 font-semibold text-gray-900">
						Wallet with Voting Power: <em class="italic"
							><span class="font-normal">{owner}</span></em
						>
					</p>
					<p class="text-sm text-gray-600">This is the address you can cast votes from.</p>

					{#if data.delegateAccount.accounts.length > 0}
						<div class="mt-5">
							<p class="text-md mb-2 font-semibold text-gray-900">
								Delegated Wallets ({data.delegateAccount.accounts.length}/5)
							</p>
							<p class="mb-3 text-sm text-gray-600">
								These are the wallets with your SMB Gen2 NFTs (usually ledgers or cold wallets).
							</p>
							<div class="overflow-x-auto">
								<table class="table table-md w-full text-gray-600">
									<thead>
										<tr>
											<th class="bg-gray-200 text-gray-700">Address</th>
											<th class="bg-gray-200 text-gray-700">Status</th>
											<th class="bg-gray-200 text-gray-700">Action</th>
										</tr>
									</thead>
									<tbody>
										{#each data.delegateAccount.accounts as account (account.address)}
											<tr>
												<td class="bg-gray-100 font-mono text-sm"
													>{trimAddress(account.address.toBase58())}</td
												>
												<td class="bg-gray-100">
													{#if account.signed}
														<div class="badge badge-success">Active</div>
													{:else}
														<div class="badge badge-error">Pending</div>
													{/if}
												</td>
												<td class="bg-gray-100">
													<button
														class="btn btn-error btn-xs"
														on:click={() => removeAccountAddressByKey(account.address)}
														disabled={loading}
													>
														Remove
													</button>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>

						<!-- Show warning if any addresses are not signed -->
						{#if data.delegateAccount.accounts.some((account) => !account.signed)}
							<div class="mt-4">
								<div class="alert alert-warning mb-4">
									<Fa icon={faWarning} class="ml-1" />
									<span>Some addresses still need to sign. Use the sign link below.</span>
								</div>
								<ul class="steps steps-vertical lg:steps-horizontal">
									<li data-content="✓" class="step step-primary text-black">Address Added</li>
									<li data-content="1" class="step text-black">Copy sign link</li>
									<li data-content="2" class="step text-black">Connect with pending wallet</li>
									<li data-content="3" class="step text-black">Sign to enable vote power</li>
								</ul>
							</div>
						{/if}
					{:else}
						<p class="mt-4 text-gray-900">No addresses added yet.</p>
					{/if}

					<!-- Add more addresses section -->
					{#if canAddMoreAddresses}
						<div class="mt-6 rounded-lg border border-gray-200 p-4">
							<p class="text-md mb-2 font-semibold text-gray-900">Add Another Address</p>
							<p class="mb-3 text-sm text-gray-600">
								You can add up to {remainingSlots} more address{remainingSlots > 1 ? 'es' : ''}.
							</p>
							<div class="flex items-center space-x-2">
								<input
									type="text"
									bind:value={newDelegateAddress}
									class="custom-input input input-primary block w-full rounded"
									placeholder="Enter Delegate Address"
									on:keypress={(event) => handleKeyPress(event)}
								/>
								<button
									class="btn btn-primary btn-sm"
									on:click={addAddressToExistingAccount}
									disabled={loading}
								>
									{#if loading}<span class="loading loading-spinner loading-xs" />{/if}
									Add
								</button>
							</div>
						</div>
					{/if}

					<div class="mt-5 flex items-end justify-end space-x-4">
						<div class="tooltip" data-tip={tooltipMessage}>
							<button class="btn btn-primary btn-md" on:click={() => copyToClipboard()}>
								<Fa class="mr-2" icon={faCopy} />
								Copy Sign Link
							</button>
						</div>
					</div>
				</div>
			</div>
		{:else if !isFetching && !currentUser}
			<div class="mx-auto max-w-3xl overflow-hidden bg-white p-6 shadow sm:rounded-lg">
				<h1 class="text-2xl font-semibold text-gray-900">Please Connect Wallet</h1>
				<p class="mt-2 text-gray-600">
					Remember to connect the wallet you want to use on this site to vote with.
				</p>
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
	.custom-input {
		@apply bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500;
	}
</style>
