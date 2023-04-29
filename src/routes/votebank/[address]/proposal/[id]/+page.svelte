<script lang="ts">
	import ProposalView from '$lib/components/Proposal/ProposalView.svelte';
	import 'prism-themes/themes/prism-shades-of-purple.min.css';
	import type { ProposalItem, VoteBankProposals } from '$lib/types';
	import {
		TREASURY_ADDRESS,
		fetchProposalById,
		getExplorerUrl,
		proposalAccountPda,
		voteAccountPda,
		votebankAccountPda
	} from '$lib/utils/solana';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace } from '@svelte-on-solana/wallet-adapter-anchor';
	import 'prism-themes/themes/prism-shades-of-purple.min.css';
	import { onMount } from 'svelte';
	import { PublicKey, type Connection, type AccountMeta, Transaction } from '@solana/web3.js';
	import { Votebank } from '$lib/anchor/accounts';
	import type {
		SettingsData,
		VoteRestrictionRule,
		VoteEntry,
		AdditionalAccountIndices
	} from '$lib/anchor/types';
	import type { VoteInstructionArgs } from '$lib/anchor/instructions/vote';
	import { toast } from '@zerodevx/svelte-toast';

	export let data: any;
	console.log('proposal page', data);
	let connection: Connection;
	let proposalItem: ProposalItem;
	let wallet: any;
	let loading = true;
	$: if ($walletStore?.wallet?.publicKey && $workSpace?.provider?.connection) {
		connection = $workSpace.provider.connection;
		wallet = $walletStore.wallet;
	}

	$: if (data) {
		proposalItem = data.proposal;
		loading = false;
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

	async function buildVoteTxn(votedFor: VoteEntry[]) {
		if (
			$workSpace.program &&
			$walletStore.publicKey &&
			$walletStore.signTransaction &&
			connection
		) {
			const votebankAccountAddress = new PublicKey(data.address);
			const voteBankAccountRaw = await Votebank.fromAccountAddress(
				connection,
				votebankAccountAddress
			);
			const votebank = voteBankAccountRaw?.pretty();
			const [proposalAccount, __] = proposalAccountPda(
				votebankAccountAddress,
				proposalItem.proposalId,
				$workSpace.program.programId
			);
			//let accountIndicies: AdditionalAccountIndices[] = [];
			const accountIndicies: any[] = [];
			const accountsMeta: AccountMeta[] = [];
			let mint: PublicKey = new PublicKey('11111111111111111111111111111111');
			const proposalSettings = proposalItem.settings as SettingsData[];
			const proposalVoteRestriction = proposalSettings.find((x) => x.__kind == 'VoteRestriction');
			if (proposalVoteRestriction) {
				const voteRestrictionValue = (proposalVoteRestriction as any)[
					'voteRestriction'
				] as VoteRestrictionRule;
				console.log('voteRestrictionValue', voteRestrictionValue);
			}
			const settings = voteBankAccountRaw.settings as SettingsData[];
			const voteRestriction = settings.find((x) => x.__kind == 'VoteRestriction');
			if (voteRestriction) {
				const voteRestrictionValue = (voteRestriction as any)[
					'voteRestriction'
				] as VoteRestrictionRule;
				console.log('voteRestrictionValue', voteRestrictionValue);
				if (voteRestrictionValue.__kind == 'TokenOwnership') {
					const tokenAddress = new PublicKey(voteRestrictionValue.mint);
					mint = tokenAddress;
					const tokenAccountAddress = await connection.getParsedTokenAccountsByOwner(
						wallet.publicKey,
						{
							mint: tokenAddress
						}
					);
					if (tokenAccountAddress.value.length > 0) {
						const tokenAccount = tokenAccountAddress.value[0].pubkey;
						// const tokenAccount = tokenAccountAddress.value[0].pubkey;
						console.log('tokenAccount', tokenAccount);
						accountsMeta.push({
							pubkey: tokenAccount,
							isWritable: true,
							isSigner: false
						});
						accountIndicies.push({
							tokenOwnership: {
								tokenIdx: 0
							}
						});
					}
				}
				if (voteRestrictionValue.__kind == 'NftOwnership') {
					const collectionAddress = new PublicKey(voteRestrictionValue.collectionId);
					//TODO: fetch nfts find the one that matches the collectionid
				}
			}
			const [vote] = voteAccountPda(votebankAccountAddress, mint, proposalItem.proposalId);
			const voteAccountCheck = await $workSpace.program.account.voteAccount.fetch(
				vote,
				'confirmed'
			)
			.catch((e) => {
				console.log('voteAccountCheck', e);
			});
			if (voteAccountCheck) {
				console.log('voteAccountCheck', voteAccountCheck);
				toast.push('You have already voted for this proposal');
				return;
			}
			const ix = await $workSpace.program.methods
				.vote(proposalItem.proposalId, votedFor, accountIndicies)
				.accounts({
					voter: wallet.publicKey,
					votebank: votebankAccountAddress,
					proposal: proposalAccount,
					votes: vote,
					nftVoteMint: mint,
					treasury: TREASURY_ADDRESS,
					systemProgram: new PublicKey('11111111111111111111111111111111')
				})
				.remainingAccounts(accountsMeta)
				.instruction();
			const tx = new Transaction().add(ix);
			tx.feePayer = $walletStore.publicKey;
			tx.recentBlockhash = (await $workSpace.connection.getLatestBlockhash()).blockhash;
			var sig = await $walletStore.signTransaction(tx);

			sig?.verifySignatures();
			const signature = await $workSpace.connection.sendRawTransaction(tx.serialize());
			console.log('Signature', signature);
			const latestBlockhash = await $workSpace.connection.getLatestBlockhash();
			const confirmTx = await $workSpace.connection.confirmTransaction(
				{
					signature: signature,
					lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
					blockhash: latestBlockhash.blockhash
				},
				'confirmed'
			);
			const voteCreatedAccount = await $workSpace.program.account.voteAccount.fetch(
				vote,
				'confirmed'
			);
			console.log('vote created data', voteCreatedAccount);
			const explorerUrl = `${getExplorerUrl('devnet', 'transaction', signature)}`;
			toast.push(`Voted! <a href="${explorerUrl}" target="_blank">${vote.toBase58()}</a>`, {
				duration: 3000,
				pausable: true
			});

			console.log('settings', settings, proposalVoteRestriction, voteRestriction);
			return { proposalAccount, votedFor, settings, votebank };
		}
	}

	async function handleVoteSubmit(event: CustomEvent) {
		const voteOptions = buildVotedFor(event.detail);
		const voteTxn = await buildVoteTxn(voteOptions);
		console.log('vote', event, voteTxn);
	}
</script>

{#if loading}
	<div class="flex h-screen items-center justify-center">
		<progress class="progress w-56" />
	</div>
{:else}
	<ProposalView proposal={proposalItem} on:vote={handleVoteSubmit} />
{/if}
