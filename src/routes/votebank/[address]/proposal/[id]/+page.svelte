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
		sleep,
		trimAddress
	} from '$lib/utils/solana';
	import { walletStore } from '@aztemi/svelte-on-solana-wallet-adapter-core';
	import { workSpace } from '@aztemi/svelte-on-solana-wallet-adapter-anchor';
	import 'prism-themes/themes/prism-shades-of-purple.min.css';
	import { PublicKey, type Connection, Transaction, TransactionInstruction, ComputeBudgetProgram } from '@solana/web3.js';
	import { Votebank } from '$lib/anchor/accounts';
	import type { Metaplex } from '@metaplex-foundation/js';
	import type { Program } from '@coral-xyz/anchor';
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
	import { set } from '@coral-xyz/anchor/dist/cjs/utils/features';
	import { filteredNftStore } from '$lib/stores/filteredNftStore';
	import { createCancelProposalInstruction } from '$lib/anchor/instructions';
	import { goto } from '$app/navigation';
	import { getProposalEndTime, isQuorumMet } from '$lib/utils/proposal';

	export let data: any;
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
			wallet.on('error', (err) => {
				setMessageSlow(`Wallet Error: ${(err as any)?.message ?? err}`, 500).then(() => {
					reset();
				});
			});
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
		const endTime = isQuorumMet(proposalItem) ? getProposalEndTime(proposalItem) :bnToDate(proposalItem.endTime);
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
		message.set('Building vote transactions...');

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
		const computeUnits = nfts.length >= 5 ? 600_000 : Math.max(80_000, nfts.length * 51_215);
		const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ 
  			units: computeUnits 
		});
		const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({ 
  			microLamports: 100000
		});
		transaction.add(modifyComputeUnits);
		transaction.add(addPriorityFee);
		if (!isNftRestricted) {
			// Add the vote instruction
			const instruction = await buildVoteTokenTxn(votedFor, votebankAccountAddress);
			if (!instruction) {
				message.set('Error building vote transaction');
				return transactions;
			}
			transaction.add(instruction);
			transactions.push(transaction);
			return transactions;
		}
		// If the vote is restricted to an nft, we need to build a transaction for each nft
		for (let nft of nfts) {
			await setMessageSlow('Building vote transaction for ' + nft.json.name, 10);
			const instruction = await buildNftVoteTxn(votedFor, votebankAccountAddress, nft);
			if (!instruction) continue;

			transaction.add(instruction);
			const txnSize = getTxSize(transaction, currentUser);
			console.log('txnSize', txnSize);
			if (txnSize > 1232) {
				// Remove the last instruction that caused the size to exceed limit
				transaction.instructions.pop();

				// Finalize the current transaction and start a new one
				transactions.push(transaction);
				transaction = new Transaction();
				transaction.feePayer = currentUser;
				const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ 
  					units: computeUnits 
				});
				const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({ 
  					microLamports: 100000 
				});
				transaction.add(modifyComputeUnits);
				transaction.add(addPriorityFee);
				transaction.add(instruction); // Add the instruction to the new transaction
			}
		}
		console.log('done looping', transaction, transaction.instructions.length, transactions);
		if (transaction.instructions.length > 0) {
			transactions.push(transaction);
		}

		return transactions;
	}
	async function sendEachTxn(txns: Transaction[]) {
		const signatures = [];
		await setMessageSlow('Simulating transactions...', 300);
		let i = 1;
		for (let txn of txns) {
			try {
				const simulated = await simulateTxn(connection, txn);
				await setMessageSlow(`Simulating transaction ${i} of ${txns.length}`, 50);
				if (!simulated) {
					i++;
					continue;
				}
				if (txns.length > 1) {
					await setMessageSlow(`Waiting for signature ${i} of ${txns.length}...`, 300);
				} else {
					message.set('Waiting for signature...');
				}
				txn.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
				const signature = await $walletStore.sendTransaction(txn, connection);
				signatures.push(signature);
				i++;
			} catch (err) {
				i++;
				console.error(err);
				await setMessageSlow(`Transaction Error: ${(err as any)?.message ?? err}`);
				continue;
			}
		}
		return signatures;
	}

	async function simulateTxn(connection: Connection, txn: Transaction) {
		const t = await connection.simulateTransaction(txn);
		if (t.value.err) {
			const messages = extractCustomCodes(t.value.err);
			if (messages.length > 0) {
				const msgString = messages.join(', ');
				await setMessageSlow(`Simulation Error: ${msgString}`);
				return false;
			}
		}
		return true;
	}

	async function signAllTxns(txns: Transaction[]) {
		const txnsToSend = [];
		let signatures: string[] = [];
		if ($walletStore.signAllTransactions) {
			await setMessageSlow('Simulating transactions...', 300);
			let i = 1;
			for (let txn of txns) {
				const simulated = await simulateTxn(connection, txn);
				await setMessageSlow(`Simulating transaction ${i} of ${txns.length}`, 50);
				if (!simulated){
					i++; 
					continue;
				} 
				i++;
				txnsToSend.push(txn);
			}
			if (txnsToSend.length === 0) {
				await sleep(1500);
				return signatures;
			}
			await setMessageSlow(
				`Waiting for signature for ${txnsToSend.length} ${
					txnsToSend.length > 1 ? 'transactions' : 'transaction'
				}...`,
				300
			);
			//For large clusters of txn sizes refresh the blockhash
			for (var txn of txnsToSend) {
				txn.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
			}
			const signedTxns = await $walletStore.signAllTransactions(txnsToSend);
			const sendPromises = signedTxns.map(async (txn: Transaction) => {
				const res = await connection
					.sendRawTransaction(txn.serialize(), {
						skipPreflight: true
					})
					.catch((err) => {
						console.error('txn error', err);
						setMessageSlow(`Transaction Error: ${(err as any)?.message ?? err}`);
						return '';
					});
				return {
					error: res === '',
					sig: res
				};
			});

			await setMessageSlow(
				`Waiting for ${sendPromises.length} ${
					sendPromises.length > 1 ? 'transactions' : 'transaction'
				} to be confirmed...`,
				300
			);
			const txnsSentSignatures = await Promise.all(sendPromises).catch((err) => {
				console.error('error sent', err);
				setMessageSlow(`Transaction Error: ${(err as any)?.message ?? err}`);
				return [{ error: true, sig: '' }];
			});
			console.log('sigs', txnsSentSignatures);
			signatures = txnsSentSignatures.filter((x) => !x.error).map((x) => x.sig);
		}
		return signatures;
	}

	async function finalizeAndSendTransactions(txns: Transaction[]) {
		let signatures: string[] = [];
		if ($walletStore.signAllTransactions) {
			signatures = await signAllTxns(txns);
		} else {
			signatures = await sendEachTxn(txns);
		}
		const latestBlockhash = await connection.getLatestBlockhash();
		const voteUrls: string[] = [];
		let confirmedCount = 0;
		for (let signature of signatures) {
			var res = await connection.confirmTransaction(
				{
					signature: signature,
					lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
					blockhash: latestBlockhash.blockhash
				},
				'confirmed'
			).catch(e => {
				console.error('error confirming', signature, e);
			});
			if (!res) continue;
			confirmedCount++;
			const explorerUrl = `${getExplorerUrl(PUBLIC_SOLANA_NETWORK, 'transaction', signature)}`;
			const voteTxUrl = `<a href="${explorerUrl}" target="_blank">${trimAddress(
				signature
			)}</a> <br/>`;
			voteUrls.push(voteTxUrl);
		}
		if (confirmedCount !== signatures.length) {
			await setMessageSlow('Vote failed to confirm');
			return;
		}
		await setMessageSlow('Vote success!');
		signatures.length > 0 ? toast.push(`Voted! ${voteUrls.join(' ')}`, {
			duration: 3000,
			pausable: true,
			target: 'new'
		}) : toast.push(`Something went wrong please make sure you are voting with the correct nft or token`, {
			duration: 5000,
			pausable: true,
			target: 'new'
		});
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

	async function cancelProposal(proposalId: number, votebank: string) {
		try {
			loadingStore.set(true);
			message.set('Cancelling proposal...');
			const voteBankAddress = new PublicKey(votebank);
			const [proposalAccount] = proposalAccountPda(new PublicKey(votebank), proposalId);
			const ix = createCancelProposalInstruction(
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
			const explorerUrl = `${getExplorerUrl(PUBLIC_SOLANA_NETWORK, 'transaction', signature)}`;
			reset();
			toast.push(
				`Proposal Cancelled! <a href="${explorerUrl}" target="_blank">${voteBankAddress.toBase58()}</a>`,
				{
					duration: 3000,
					pausable: true
				}
			);
			await goto('/');
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
			filteredNftStore.pushIneligible(event.detail.selectedNfts);
			data.proposal.voterCount += event.detail.selectedNfts ? event.detail.selectedNfts.length : 1;
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
			const { proposalId, votebank } = e.detail;
			await closeProposal(proposalId, votebank);
		} else {
			toast.push(`You are not an authorized owner of this proposal`, { target: 'new' });
		}
	}

	async function handleCancelProposal(e: CustomEvent<any>): Promise<void> {
		if (
			isOwner &&
			connection &&
			wallet &&
			metaplex &&
			program &&
			currentUser &&
			$walletStore.signTransaction
		) {
			const { proposalId, votebank } = e.detail;
			await cancelProposal(proposalId, votebank);
		} else {
			toast.push(`You are not an authorized to cancel proposal`, { target: 'new' });
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
		on:cancelProposal={handleCancelProposal}
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
