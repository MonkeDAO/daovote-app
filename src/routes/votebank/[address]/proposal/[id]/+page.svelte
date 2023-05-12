<script lang="ts">
	import ProposalView from '$lib/components/Proposal/ProposalView.svelte';
	import 'prism-themes/themes/prism-shades-of-purple.min.css';
	import type { NftMetadata, ProposalItem } from '$lib/types';
	import {
		bnToDate,
		extractCustomCodes,
		extractRestrictionData,
		getExplorerUrl,
		getTxSize,
		proposalAccountPda,
		sleep
	} from '$lib/utils/solana';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace } from '@svelte-on-solana/wallet-adapter-anchor';
	import 'prism-themes/themes/prism-shades-of-purple.min.css';
	import { PublicKey, type Connection, Transaction, TransactionInstruction } from '@solana/web3.js';
	import { Votebank } from '$lib/anchor/accounts';
	import type { Metaplex } from '@metaplex-foundation/js';
	import type { Program } from '@project-serum/anchor';
	import { walletProgramConnection } from '$lib/wallet';
	import type { SettingsData, VoteEntry } from '$lib/anchor/types';
	import { SvelteToast, toast } from '@zerodevx/svelte-toast';
	import type { Adapter } from '@solana/wallet-adapter-base';
	import { getRemainingSeconds, getRemainingTime } from '$lib/utils/date';
	import { createCloseProposalInstruction } from '$lib/anchor/instructions/closeProposal';
	import { nftStoreUser } from '$lib/stores/nftStoreUser';
	import { nftSyncStore, nftWalletDisconnectListener } from '$lib/stores/nftStore';
	import { ownerCheckStore, ownerCheckSyncStore } from '$lib/stores/ownerStore';
	import { message } from '$lib/stores/messageStore';
	import { loading as loadingStore } from '$lib/stores/loadingStore';
	import { PUBLIC_SOLANA_NETWORK } from '$env/static/public';
	import { buildNftVoteIx, buildTokenVoteIx } from '$lib/utils/votehelpers';

	export let data: any;
	console.log('proposal page', data);
	let nfts: NftMetadata[];
	let connection: Connection;
	let proposalItem: ProposalItem;
	let votebankSettings: SettingsData[];
	let wallet: Adapter;
	let loading = true;
	let text = 'Loading...';
	let error = false;
	let ready: boolean;
	let ended = false;
	let currentUser: PublicKey;
	let metaplex: Metaplex;
	let program: Program;
	let isOwner: boolean;

	$: {
		isOwner = $ownerCheckStore.isOwner;
		$ownerCheckSyncStore;
	}
	const walletConnectionFactory = walletProgramConnection(walletStore, workSpace);
	const nftWallet = nftStoreUser(walletStore);
	$: {
		ready = $walletConnectionFactory.ready;
		if (ready && $walletConnectionFactory.connection) {
			connection = $walletConnectionFactory.connection;
		}
		if (ready && $walletConnectionFactory.wallet) {
			wallet = $walletConnectionFactory.wallet;
		}
		if (ready && $walletConnectionFactory.metaplex) {
			metaplex = $walletConnectionFactory.metaplex;
		}
		if (ready && $walletConnectionFactory.program) {
			program = $walletConnectionFactory.program;
		}
		if (ready && $walletConnectionFactory.publicKey) {
			currentUser = $walletConnectionFactory.publicKey;
		}
	}
	$: {
		if ($nftWallet.nfts) {
			nfts = $nftWallet.nfts;
		}
		$nftSyncStore; // access nftSyncStore
		$nftWalletDisconnectListener;
	}

	$: data = data;
	$: if (data && data.proposal) {
		proposalItem = data.proposal;
		loading = false;
		error = false;
	} else if (data && !data.proposal) {
		error = true;
		text =
			'Proposal not found. Try reloading the page. If this was recently created it may take a few seconds to appear.';
	}
	if (data && data.voteBankSettings) {
		votebankSettings = data.voteBankSettings;
	}

	function buildVotedFor(selectedOptions: any[]) {
		const votedFor = selectedOptions.map((x) => {
			return {
				proposalId: proposalItem.proposalId,
				votedFor: x.id
			} as VoteEntry;
		});
		return votedFor;
	}

	async function buildVoteTokenTxn(
		votedFor: VoteEntry[],
		votebankAccountAddress: PublicKey
	): Promise<TransactionInstruction | null> {
		try {
			return await buildTokenVoteIx(
				connection,
				currentUser,
				votebankAccountAddress,
				votedFor,
				proposalItem.proposalId,
				proposalItem
			);
		} catch (e: any) {
			console.error('Error building vote transaction', e);
			message.set(`Error: ${e?.message ?? e}. Skipping this transaction.`); //clear message
			return null;
		}
	}

	async function buildNftVoteTxn(
		votedFor: VoteEntry[],
		votebankAccountAddress: PublicKey,
		nft: NftMetadata
	): Promise<TransactionInstruction | null> {
		try {
			return await buildNftVoteIx(
				connection,
				currentUser,
				votebankAccountAddress,
				votedFor,
				proposalItem.proposalId,
				nft,
				proposalItem
			);
		} catch (e: any) {
			console.error('Error building vote transaction', e);
			await setMessageSlow(`Error: ${e?.message ?? e}. Skipping this transaction.`); //clear message
			return null;
		}
	}

	async function buildVoteTransactions(
		votedFor: VoteEntry[],
		nfts: NftMetadata[]
	): Promise<Transaction[]> {
		const transactions: Transaction[] = [];
		const endTime = bnToDate(proposalItem.endTime);
		const remainingTime = getRemainingTime(endTime);
		const totalSecondsRemaining = getRemainingSeconds(remainingTime);
		if (totalSecondsRemaining < 30 && !ended) {
			toast.push('Less than 30 seconds remaining. This vote might fail!', { target: 'new' });
		}
		if (remainingTime.ended) {
			toast.pop({ target: 'new' });
			toast.push('Vote has ended.', { target: 'new' });
			ended = true;
			return transactions;
		}
		loadingStore.set(true);

		const votebankAccountAddress = new PublicKey(data.address);
		const voteBankAccountRaw = await Votebank.fromAccountAddress(
			connection,
			votebankAccountAddress
		);
		const [proposalAccount] = proposalAccountPda(
			votebankAccountAddress,
			proposalItem.proposalId,
			program.programId
		);
		const proposalSettings = proposalItem.settings as SettingsData[];
		const settings = voteBankAccountRaw.settings as SettingsData[];
		const { isNftRestricted } = extractRestrictionData(settings);
		let transaction = new Transaction();
		transaction.feePayer = currentUser;
		if (!isNftRestricted) {
			// Add the vote instruction
			const instruction = await buildVoteTokenTxn(votedFor, votebankAccountAddress);
			if (!instruction) {
				message.set('Error building vote transaction');
				return transactions;
			}
			transaction.add(instruction);
			transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
			transactions.push(transaction);
			return transactions;
		}
		// If the vote is restricted to an nft, we need to build a transaction for each nft
		for (let nft of nfts) {
			await setMessageSlow('Building vote transaction for ' + nft.json.name);
			const instruction = await buildNftVoteTxn(votedFor, votebankAccountAddress, nft);
			console.log('instruction', instruction);
			if (!instruction) continue;

			transaction.add(instruction);
			transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
			const txnSize = getTxSize(transaction, currentUser);
			console.log('txnSize', txnSize);
			if (txnSize > 1282) {
				// Remove the last instruction that caused the size to exceed limit
				transaction.instructions.pop();

				// Finalize the current transaction and start a new one
				transactions.push(transaction);
				transaction = new Transaction();
				transaction.feePayer = currentUser;
				transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
				transaction.add(instruction); // Add the instruction to the new transaction
			}
		}
		console.log('done looping', transaction, transaction.instructions.length, transactions);
		if (transaction.instructions.length > 0) {
			transactions.push(transaction);
		}

		return transactions;
	}

	async function finalizeAndSendTransactions(txns: Transaction[]) {
		const signatures = [];
		await setMessageSlow('Simulating transactions...', 300);
		let i = 1;
		for (let txn of txns) {
			const t = await connection.simulateTransaction(txn);
			if (t.value.err) {
				const messages = extractCustomCodes(t.value.err);
				if (messages.length > 0) {
					const msgString = messages.join(', ');
					message.set(`Error: ${msgString}`);
					continue; //dont fail on simulation error just move on.
				}
			}
			if (txns.length > 1) {
				await setMessageSlow(`Waiting for signature ${i} of ${txns.length}...`, 300);
			} else {
				message.set('Waiting for signature...');
			}
			const signature = await $walletStore.sendTransaction(txn, connection);
			i++;
			signatures.push(signature);
		}

		const latestBlockhash = await connection.getLatestBlockhash();

		for (let signature of signatures) {
			await connection.confirmTransaction(
				{
					signature: signature,
					lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
					blockhash: latestBlockhash.blockhash
				},
				'confirmed'
			);
			await setMessageSlow('Vote success!');
			const explorerUrl = `${getExplorerUrl(PUBLIC_SOLANA_NETWORK, 'transaction', signature)}`;
			toast.push(`Voted! <a href="${explorerUrl}" target="_blank">${signature}</a>`, {
				duration: 3000,
				pausable: true,
				target: 'new'
			});
		}
		reset();
	}

	async function closeProposal(proposalId: number, votebank: string) {
		try {
			loadingStore.set(true);
			message.set('Closing proposal...');
			const voteBankAddress = new PublicKey(votebank);
			const [proposalAccount] = proposalAccountPda(new PublicKey(votebank), proposalId);
			const ix = createCloseProposalInstruction(
				{
					proposal: proposalAccount,
					proposalOwner: currentUser,
					votebank: voteBankAddress,
					systemProgram: new PublicKey('11111111111111111111111111111111')
				},
				{
					proposalId: proposalId
				}
			);
			const tx = new Transaction().add(ix);
			tx.feePayer = currentUser;
			tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
			message.set('Simulating transaction...');
			//const test = VersionedTransaction.deserialize(tx.serialize());
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
			//Force close refresh data on page
			data.proposal.voteOpen = false;
			const explorerUrl = `${getExplorerUrl(PUBLIC_SOLANA_NETWORK, 'transaction', signature)}`;
			reset();
			toast.push(
				`Proposal closed! <a href="${explorerUrl}" target="_blank">${voteBankAddress.toBase58()}</a>`,
				{
					duration: 3000,
					pausable: true
				}
			);
		} catch (e: any) {
			message.set(`Error: ${e?.message ?? e}`); //clear message
			setTimeout(() => {
				reset();
			}, 1200);
		}
	}

	async function setMessageSlow(msg: string, delay = 500) {
		message.set(msg);
		await sleep(delay);
	}
	function reset() {
		loadingStore.set(false);
		message.set('');
	}

	async function handleVoteSubmit(event: CustomEvent) {
		const voteOptions = buildVotedFor(event.detail.chosenOptions);
		if (
			connection &&
			wallet &&
			metaplex &&
			program &&
			currentUser &&
			$walletStore.signTransaction
		) {
			const voteTxns = await buildVoteTransactions(voteOptions, event.detail.selectedNfts);
			if (voteTxns.length === 0) {
				toast.push(`No votes to submit`, { target: 'new' });
				reset();
				return;
			}
			await finalizeAndSendTransactions(voteTxns);
			data.proposal.voterCount =
				data.proposal.voterCount + event.detail.selectedNfts ? event.detail.selectedNfts.length : 1;
		}
	}

	async function handleCloseProposal(e: CustomEvent<any>): Promise<void> {
		if (
			isOwner &&
			connection &&
			wallet &&
			metaplex &&
			program &&
			currentUser &&
			$walletStore.signTransaction
		) {
			console.log('close proposal', e.detail);
			const { proposalId, votebank } = e.detail;
			await closeProposal(proposalId, votebank);
		} else {
			toast.push(`You are not an authorized owner of this proposal`, { target: 'new' });
		}
	}
</script>

<div class="wrap">
	<SvelteToast target="new" options={{ intro: { y: -64 } }} />
</div>
{#if loading || error}
	<div class="flex min-h-screen items-center justify-center">
		<div class="mb-16 max-w-2xl">
			<h3
				class="mx-auto max-w-md text-3xl font-bold leading-relaxed text-gray-900 dark:text-gray-100"
			>
				{text}
			</h3>
			<progress class="w-70 progress progress-primary" />
		</div>
	</div>
{:else}
	<ProposalView
		proposalData={{
			proposal: proposalItem,
			nfts,
			votebankSettings
		}}
		on:vote={handleVoteSubmit}
		on:closeProposal={handleCloseProposal}
	/>
{/if}

<style>
	wrap {
		--toastContainerTop: 0.5rem;
		--toastContainerRight: 0.5rem;
		--toastContainerBottom: auto;
		--toastContainerLeft: 0.5rem;
		--toastWidth: 100%;
		--toastMinHeight: 2rem;
		--toastPadding: 0 0.5rem;
		font-size: 0.875rem;
	}
	@media (min-width: 40rem) {
		.wrap {
			--toastContainerRight: auto;
			--toastContainerLeft: calc(50vw - 20rem);
			--toastWidth: 40rem;
		}
	}
</style>
