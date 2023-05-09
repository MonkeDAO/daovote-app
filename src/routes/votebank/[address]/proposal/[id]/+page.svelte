<script lang="ts">
	import ProposalView from '$lib/components/Proposal/ProposalView.svelte';
	import 'prism-themes/themes/prism-shades-of-purple.min.css';
	import type { NftMetadata, ProposalItem } from '$lib/types';
	import {
		TREASURY_ADDRESS,
		bnToDate,
		extractRestrictionData,
		getDefaultPublicKey,
		getExplorerUrl,
		isDefaultPublicKey,
		proposalAccountPda,
		toAccountMetadata,
		voteAccountPda
	} from '$lib/utils/solana';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace } from '@svelte-on-solana/wallet-adapter-anchor';
	import 'prism-themes/themes/prism-shades-of-purple.min.css';
	import { PublicKey, type Connection, type AccountMeta, Transaction } from '@solana/web3.js';
	import { Votebank } from '$lib/anchor/accounts';
	import type { Metaplex } from '@metaplex-foundation/js';
	import type { Program } from '@project-serum/anchor';
	import { walletProgramConnection } from '$lib/wallet';
	import type { SettingsData, VoteEntry } from '$lib/anchor/types';
	import { SvelteToast, toast } from '@zerodevx/svelte-toast';
	import { getAssociatedTokenAddress } from '@solana/spl-token';
	import type { Adapter } from '@solana/wallet-adapter-base';
	import { getRemainingSeconds, getRemainingTime, isDefaultDate } from '$lib/utils/date';
	import { createCloseProposalInstruction } from '$lib/anchor/instructions/closeProposal';

	export let data: any;
	console.log('proposal page', data);
	let connection: Connection;
	let proposalItem: ProposalItem;
	let wallet: Adapter;
	let loading = true;
	let text = 'Loading...';
	let error = false;
	let ready: boolean;
	let ended = false;
	let currentUser: PublicKey;
	let metaplex: Metaplex;
	let program: Program;
	let owners: PublicKey[] = [];
	let isOwner: boolean;
	let nfts: any[];
	const walletConnectionFactory = walletProgramConnection(walletStore, workSpace);
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

	$: if (ready && currentUser && connection) {
		fetchNftsFromServer();
	}

	async function fetchNftsFromServer() {
		try {
			console.log('fetching nfts', currentUser.toBase58());
			const publicKey = currentUser.toBase58();
			const res = await fetch(`/api/fetchNfts/${publicKey}`);
			const data = await res.json();
			if (data.error) {
				throw new Error(data.error);
			}

			nfts = data.nfts;
		} catch (err) {
			console.error(err);
		}
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
	if (data && data.owners) {
		owners = data.owners;
	}

	$: {
		if (owners && currentUser) {
			isOwner = owners.some((x) => x.equals(currentUser));
			console.log('isOwner', isOwner);
		}
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

	async function buildVoteTxn(votedFor: VoteEntry[], nfts: NftMetadata[]) {
		if (
			connection &&
			wallet &&
			metaplex &&
			program &&
			currentUser &&
			$walletStore.signTransaction
		) {
			console.log('proposalItem', proposalItem);
			const endTime = bnToDate(proposalItem.endTime);
			const isDefault = isDefaultDate(endTime);
			if (!isDefault) {
				const remainingTime = getRemainingTime(endTime);
				const totalSecondsRemaining = getRemainingSeconds(remainingTime);
				if (totalSecondsRemaining < 30 && !ended) {
					toast.push('Less than 30 seconds remaining. This vote might fail!', { target: 'new' });
				}
				if (remainingTime.ended) {
					toast.pop({ target: 'new' });
					toast.push('Vote has ended.', { target: 'new' });
					ended = true;
					return;
				}
			}
			const votebankAccountAddress = new PublicKey(data.address);
			const voteBankAccountRaw = await Votebank.fromAccountAddress(
				connection,
				votebankAccountAddress
			);
			const votebank = voteBankAccountRaw?.pretty();
			const [proposalAccount] = proposalAccountPda(
				votebankAccountAddress,
				proposalItem.proposalId,
				program.programId
			);
			//let accountIndicies: AdditionalAccountIndices[] = [];
			const accountsMeta: AccountMeta[] = [];
			const proposalSettings = proposalItem.settings as SettingsData[];
			const {
				restrictionMint: proposalRestrictionMint,
				isNftRestricted: proposalIsNftRestricted,
				restrictionIx: proposalRestrictionIx,
				ruleKind: proposalRulekind
			} = extractRestrictionData(proposalSettings);
			const settings = voteBankAccountRaw.settings as SettingsData[];
			const { restrictionMint, isNftRestricted, restrictionIx, ruleKind } =
				extractRestrictionData(settings);
			let mint = getDefaultPublicKey();
			let nftMintMetadata = getDefaultPublicKey();
			let tokenAccount = getDefaultPublicKey();
			let additionalAccountOffsets: any = null; //needs to be null to serialize if offsets not needed
			//TODO: Break up into multiple IX per NFTs passed in. important!
			if (isNftRestricted) {
				if (nfts.length === 0) {
					toast.push('You must select at least one NFT to vote.', { target: 'new' });
					return;
				}
				// Find by collection id:
				nfts.find((nft) => {
					if (nft.collection && nft.collection.address === restrictionMint.toBase58()) {
						mint = new PublicKey(nft.address);
						nftMintMetadata = new PublicKey(nft.metadataAddress);
						return true;
					}
					return false;
				});
				additionalAccountOffsets = [
					{
						nftOwnership: {
							tokenIdx: 0,
							metaIdx: 1,
							collectionIdx: 2
						}
					}
				];
				tokenAccount = await getAssociatedTokenAddress(mint, currentUser);
			} else if (restrictionIx && !isNftRestricted) {
				tokenAccount = await getAssociatedTokenAddress(restrictionMint, currentUser);
				/**
				 * Set the mint to the restriction mint since its a token. this needs to be passed as the nftVoteMint for ix
				 */
				mint = restrictionMint;
				console.log('Token account', tokenAccount.toBase58());
				additionalAccountOffsets = [
					{
						tokenOwnership: {
							tokenIdx: 0
						}
					}
				];
			}

			if (restrictionIx && isDefaultPublicKey(tokenAccount)) {
				toast.push(
					`You need to have this token ${restrictionMint.toBase58()} to create a proposal`,
					{ target: 'new' }
				);
				return;
			}
			const tokenToAccountMetaFormat = isNftRestricted
				? [
						toAccountMetadata(tokenAccount),
						toAccountMetadata(nftMintMetadata),
						toAccountMetadata(restrictionMint)
				  ]
				: restrictionIx
				? [toAccountMetadata(tokenAccount)]
				: [];
			const [vote] = voteAccountPda(votebankAccountAddress, mint, proposalItem.proposalId);
			const voteAccountCheck = await program.account.voteAccount
				.fetch(vote, 'confirmed')
				.catch((e) => {
					console.log('voteAccountCheck', e);
				});
			if (voteAccountCheck) {
				console.log('voteAccountCheck', voteAccountCheck);
				toast.push('You have already voted for this proposal');
				return;
			}
			console.log('vote', {
				voteAccount: vote.toBase58(),
				Nftmint: mint.toBase58(),
				mint: mint.toBase58(),
				accountOffsets: additionalAccountOffsets,
				accountsMeta,
				tokenToAccountMetaFormat
			});
			const ix = await program.methods
				.vote(proposalItem.proposalId, votedFor, additionalAccountOffsets)
				.accounts({
					voter: currentUser,
					votebank: votebankAccountAddress,
					proposal: proposalAccount,
					votes: vote,
					nftVoteMint: mint,
					treasury: TREASURY_ADDRESS,
					systemProgram: new PublicKey('11111111111111111111111111111111')
				})
				.remainingAccounts(tokenToAccountMetaFormat)
				.instruction();
			const tx = new Transaction().add(ix);
			tx.feePayer = currentUser;
			tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
			var sig = await $walletStore.signTransaction(tx);

			sig?.verifySignatures();
			const signature = await connection.sendRawTransaction(tx.serialize());
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
			const voteCreatedAccount = await program.account.voteAccount.fetch(vote, 'confirmed');
			console.log('vote created data', voteCreatedAccount);
			const explorerUrl = `${getExplorerUrl('devnet', 'transaction', signature)}`;
			toast.push(`Voted! <a href="${explorerUrl}" target="_blank">${vote.toBase58()}</a>`, {
				duration: 3000,
				pausable: true
			});
			data.proposal.voterCount = data.proposal.voterCount + 1;
			return { proposalAccount, votedFor, settings, votebank };
		}
	}

	async function closeProposal(proposalId: number, votebank: string) {
		if (
			connection &&
			wallet &&
			metaplex &&
			program &&
			currentUser &&
			$walletStore.signTransaction
		) {
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
			var sig = await $walletStore.signTransaction(tx);

			sig?.verifySignatures();
			const signature = await connection.sendRawTransaction(tx.serialize());
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
			const explorerUrl = `${getExplorerUrl('devnet', 'transaction', signature)}`;
			toast.push(
				`Proposal closed! <a href="${explorerUrl}" target="_blank">${voteBankAddress.toBase58()}</a>`,
				{
					duration: 3000,
					pausable: true
				}
			);
		}
	}

	async function handleVoteSubmit(event: CustomEvent) {
		const voteOptions = buildVotedFor(event.detail.chosenOptions);
		const voteTxn = await buildVoteTxn(voteOptions, event.detail.selectedNfts);
		console.log('vote', event, voteTxn);
	}

	async function handleCloseProposal(e: CustomEvent<any>): Promise<void> {
		if (isOwner) {
			console.log('close proposal', e.detail);
			const { proposalId, votebank } = e.detail;
			toast.push(`Closing proposal...`, { target: 'new' });
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
		proposal={proposalItem}
		on:vote={handleVoteSubmit}
		on:closeProposal={handleCloseProposal}
		{isOwner}
		{nfts}
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
