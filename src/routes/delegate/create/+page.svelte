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

	let delegateAddress = '';
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

	const removeAccountAddress = async () => {
		if (!data?.delegateAccountAddress || !delegateAddressPublickey) {
			return;
		}
		const ix = createRemoveDelegateAddressInstruction(
			{
				delegateAccount: new web3.PublicKey(data.delegateAccountAddress),
				signer: currentUser,
				systemProgram: web3.SystemProgram.programId
			},
			{
				address: delegateAddressPublickey
			}
		);
		await processTransaction(ix);
		await fetchData(currentUser);
		delegateAddressPublickey = null;
		delegateAddress = '';
	};

	const processTransaction = async (
		instruction: TransactionInstruction | TransactionInstruction[]
	) => {
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
	};

	const createDelegate = async () => {
		if (!isValidSolAddress(delegateAddress)) return;
		const mappedAddress = [
			{
				address: new PublicKey(delegateAddress),
				signed: false
			}
		];
		loadingStore.set(true);
		loading = true;
		let ix;
		const [delegateAccountAddress, _] = delegateAccountPda(currentUser);
		if (data?.delegateAccount) {
			ix = createAddDelegateAddressInstruction(
				{
					delegateAccount: new web3.PublicKey(delegateAccountAddress),
					signer: currentUser,
					systemProgram: web3.SystemProgram.programId,
					treasury: TREASURY_ADDRESS
				},
				{
					address: new PublicKey(delegateAddress)
				}
			);
		} else {
			ix = createCreateDelegateInstruction(
				{
					delegate: delegateAccountAddress,
					delegator: currentUser,
					treasury: TREASURY_ADDRESS,
					systemProgram: SYSTEM_PROGRAM_ID
				},
				{
					delegateAddresses: mappedAddress
				}
			);
		}

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
			reset();
			currentUser = currentUser;
			// goto('/delegate/create', { replaceState: true, invalidateAll: true });
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
		if (!isValidSolAddress(delegateAddress)) {
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
</script>

<LoadingOverlay />
<ConfirmationModal
	data={delegateAddress}
	bind:this={confirmationModal}
	message="This will allow {trimAddress(
		currentUser?.toBase58()
	)} to vote on proposals with the voting power of {delegateAddress}. Are you sure you want to continue?"
	eventOnConfirm="confirm"
	on:confirm={handleConfirm}
/>

<div class="container mx-auto px-4 sm:px-6 lg:px-8">
	<div class="py-5">
		<div class="mx-auto max-w-md text-gray-900 dark:text-gray-100">
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
				Add an address to your delegate account and sign it with the wallet that has your monke in
				it. You can then vote with the wallet that has the voting power from your monke. You can
				remove and replace the address at any time.
			</p>
			<h3 class="mt-8 text-2xl font-bold leading-relaxed">Which wallet do I use?</h3>
			<p>
				The wallet that should be utilizing this page is the one that you will be voting with
				(burner or hot wallet). In order to reduce the amount of times the wallet with the NFTs is
				connected to this site, use the input box to input your address that holds the NFTs. The
				address should be the one that holds the NFTs, not the one that you will be voting with.
			</p>
			<div class="mb-8 mt-8 flex hidden items-center justify-center md:block">
				{#if isDark}
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
					Make sure you're connected with the wallet you want to vote on proposals with.
				</p>
				{#if data?.delegateAccountAddress}
					<div class="alert alert-warning mt-4">
						<Fa icon={faWarning} class="ml-1" />
						<span>Delegation is enabled but no addresses added yet. Add an address below.</span>
					</div>
				{/if}
				<div class="flex h-full flex-col justify-between">
					<div class="mt-5">
						<label for="delegateAddresses" class="leading-loose text-gray-900"
							>Enter Wallet Address with SMB Gen2</label
						>
						<div class="mb-5 flex items-center space-x-2">
							<input
								type="text"
								bind:value={delegateAddress}
								class="custom-input max-ws-xs input-primary input mt-1 block w-full rounded"
								placeholder=" Address"
								required
								on:keypress={(event) => handleKeyPress(event)}
							/>
						</div>
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
						<p class="text-md font-semibold” mt-5 text-gray-900">
							Wallet with Voting Power: <em class="italic"
								><span class="font-normal">{owner}</span></em
							>
						</p>
						<p class="text-sm text-gray-600">This is the address you can cast votes from.</p>
						<p class="text-md mt-5 font-semibold text-gray-900">
							Wallet with SMB Gen2 NFTs: <em class="italic"
								><span
									class="font-normal {data.delegateAccount.accounts[0].signed
										? 'text-green-500'
										: 'text-red-500'}">{data.delegateAccount.accounts[0].address}</span
								></em
							>
						</p>
						<p class="mb-4 text-sm text-gray-600">
							This is the address with your SMB Gen2 NFTs (usually a ledger or cold wallet).
						</p>
						<div class="mb-2 flex">
							{#if !data.delegateAccount.accounts[0].signed}
								<div class="mr-6 flex items-center text-sm text-gray-600">
									<span class="mr-1 inline-block h-4 w-4 rounded-full bg-red-500" />
									<em class="italic">Not Active</em>
								</div>
							{:else}
								<div class="flex items-center text-sm text-gray-600">
									<span class="mr-1 inline-block h-4 w-4 rounded-full bg-green-500" />
									<em class="italic">Active</em>
								</div>
							{/if}
						</div>
						{#if !data.delegateAccount.accounts[0].signed}
							<div class="mb-2">
								<div class="alert alert-warning mb-4">
									<Fa icon={faWarning} class="ml-1" />
									<span>Delegation is still not complete. Please complete the remaining steps below.</span>
								</div>
								<ul class="steps">
									<li data-content="✓" class="step-primary step">Address Added</li>
									<li data-content="1" class="step">Go to copied sign link</li>
									<li data-content="2" class="step">
										Connect with {trimAddress(data.delegateAccount.accounts[0].address.toBase58())}
									</li>
									<li data-content="3" class="step">Sign to enable vote power</li>
								</ul>
							</div>
						{/if}
						<div class="mt-5 flex items-end justify-end space-x-4">
							{#if delegateAddressPublickey}
								<button
									class="btn-primary btn mt-5 self-end text-gray-900"
									on:click={removeAccountAddress}
									>{#if loading}<span class="loading loading-spinner" />{/if}Remove Delegation</button
								>
							{/if}
							<div class="tooltip ml-2" data-tip={tooltipMessage}>
								<button class="btn-primary btn-md btn self-end" on:click={() => copyToClipboard()}>
									<Fa class="ml-2" icon={faCopy} />
									Generate Sign Link
								</button>
							</div>
						</div>
					</div>
				{:else}
					<p class="text-gray-900">Delegation is enabled but no addresses added yet.</p>
				{/if}
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
	.custom-input {
		@apply bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500;
	}
</style>
