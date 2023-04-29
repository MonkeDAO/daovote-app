<script lang="ts">
	import 'prism-themes/themes/prism-shades-of-purple.min.css';
	import ProposalForm from '../../../../lib/components/Proposal/ProposalForm.svelte';
	import { PublicKey, type Connection, Transaction } from '@solana/web3.js';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace } from '@svelte-on-solana/wallet-adapter-anchor';
	import { SvelteToast, toast } from '@zerodevx/svelte-toast';
	import { createStorageAccount, getStorageAccounts, uploadToShadowDrive } from '$lib/drive';
	import { shdwBalanceStore } from '$lib/shdwbalance';
	import type { Metaplex } from '@metaplex-foundation/js';
	import { onDestroy } from 'svelte';
	import { walletProgramConnection } from '$lib/wallet';
	import {
		SYSTEM_PROGRAM_ID,
		TREASURY_ADDRESS,
		getDefaultPublicKey,
		getExplorerUrl,
		isDefaultPublicKey,
		postDataToBuffer,
		proposalAccountPda,
		toAccountMetadata,
		votebankAccountPda
	} from '$lib/utils/solana';
	import type { Program } from '@project-serum/anchor';
	import { getAssociatedTokenAddress } from '@solana/spl-token';
	import { Votebank } from '$lib/anchor/accounts';
	import type { SettingsData, VoteRestrictionRule } from '$lib/anchor/types';
	export let data: any;
	let file: any;
	let votebankAddress: PublicKey;
	let proposal: any;
	let connection: Connection;
	let currentUser: PublicKey;
	let metaplex: Metaplex;
	let program: Program;
	let shadowDriveUrl: string;
	let wallet: any;
	let shdwBalance: number;
	let ready: boolean;
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
		console.log('Derived store updated:', $walletConnectionFactory);
	}
	$: if (data.address) {
		votebankAddress = new PublicKey(data.address);
	}
	console.log(
		'walletFactory',
		$walletConnectionFactory,
		$walletConnectionFactory.metaplex,
		$walletConnectionFactory.publicKey?.toBase58()
	);
	const unsubscribe = shdwBalanceStore.subscribe((value) => {
		shdwBalance = value.balance;
	});

	async function createProposal() {
		try {
			if (
				connection &&
				wallet &&
				metaplex &&
				program &&
				currentUser &&
				$walletStore.signTransaction &&
				votebankAddress
			) {
				toast.push('Creating proposal...', { target: 'new' });
				/* interact with the program via rpc */
				console.log('Vote', $workSpace.baseAccount?.publicKey.toBase58());
				const voteBankAccountRaw = await Votebank.fromAccountAddress(
					connection,
					votebankAddress
				);
				//@ts-ignore
				const description = (voteBankAccountRaw.settings as SettingsData[]).find(x => x.__kind == "Description");
				let title = '';
				if (description) {
					const { title: settingsTitle, desc } = description as any;
					title = settingsTitle;
				}
				let proposalId = 1;

				if (voteBankAccountRaw) {
					proposalId = voteBankAccountRaw.maxChildId as number;
				}
				const [proposalAccount, __] = proposalAccountPda(
					votebankAddress,
					proposalId,
					program.programId
				);
				console.log(
					'Proposal account',
					proposalAccount.toBase58(),
					proposalId,
					votebankAddress.toBase58(),
					voteBankAccountRaw,
					title,
				);

				//TODO figure out how to get the token mint from settings and use that instead of hardcoding
				const settings = voteBankAccountRaw.settings as SettingsData[];
				const voteRestriction = settings.find((x) => x.__kind == 'VoteRestriction');
				let restrictionMint = getDefaultPublicKey();
				let isNftRestricted = false;
				let restrictionIx = false;
				if (voteRestriction) {
					console.log('Vote restriction', voteRestriction);
					const voteRestrictionValue = (voteRestriction as any)[
					'voteRestriction'
					] as VoteRestrictionRule;
					console.log('Vote restriction value', voteRestrictionValue)
					if (voteRestrictionValue.__kind == 'TokenOwnership') {
						restrictionIx = true;
						restrictionMint = voteRestrictionValue.mint;
					} else if (voteRestrictionValue.__kind == 'NftOwnership') {
						restrictionMint = new PublicKey(
							voteRestrictionValue.collectionId
						);
						isNftRestricted = true;
						restrictionIx = true;
					}
					console.log('Restriction mint', restrictionMint.toBase58(),  { restrictionIx, isNftRestricted });
					//TODO: handle other types of restrictions
				}
				let nftMint = getDefaultPublicKey();
				let nftMintMetadata = getDefaultPublicKey();
				let tokenAccount = getDefaultPublicKey();
				let additionalAccountOffsets: any = null; //needs to be null to serialize if offsets not needed
				if (isNftRestricted) {
					const nfts = await metaplex.nfts().findAllByOwner({
						owner: currentUser
					});

					// Find by collection id:
					nfts.find((nft) => {
						if (
							nft.collection &&
							nft.collection.address.toBase58() === restrictionMint.toBase58()
						) {
							nftMint = (nft as any)['mintAddress'];
							nftMintMetadata = nft.address;
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
					tokenAccount = await getAssociatedTokenAddress(nftMint, currentUser);
				} else if (restrictionIx && !isNftRestricted) {
					tokenAccount = await getAssociatedTokenAddress(restrictionMint, currentUser);
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

				const options = proposal.options.map((option: any) => {
					return { id: option.id, title: option.name };
				});

				const tokenToAccountMetaFormat = isNftRestricted
					? [
							toAccountMetadata(tokenAccount),
							toAccountMetadata(nftMintMetadata),
							toAccountMetadata(restrictionMint)
					  ]
					: restrictionIx
					? [toAccountMetadata(tokenAccount)]
					: [];

				const postData = {
					title: proposal.title,
					summary: proposal.description,
					url: shadowDriveUrl
				};
				console.log('Post data', postData, additionalAccountOffsets, tokenToAccountMetaFormat);
				const ix = await program.methods
					.createProposal(
						options,
						Number(proposal.maxOptions),
						postDataToBuffer(postData),
						proposalId,
						[], //TODO: add settings if needed?
						additionalAccountOffsets
					)
					.accounts({
						proposal: proposalAccount,
						votebank: votebankAddress,
						poster: currentUser,
						treasury: TREASURY_ADDRESS,
						systemProgram: SYSTEM_PROGRAM_ID
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
				const confirmTx = await connection.confirmTransaction(
					{
						signature: signature,
						lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
						blockhash: latestBlockhash.blockhash
					},
					'confirmed'
				);
				const proposalCreatedAccount = await program.account.proposal.fetchNullable(
					proposalAccount,
					'confirmed'
				);
				console.log('Proposal created data', proposalCreatedAccount);
				const explorerUrl = `${getExplorerUrl('devnet', 'transaction', signature)}`;
				toast.push(
					`Proposal created <a href="/votebank/${votebankAddress}/proposal/${proposalId}" target="_blank">View proposal</a> </br> <a href="${explorerUrl}" target="_blank">View on Solana Explorer</a>`,
					{
						target: 'new',
						duration: 3000,
						pausable: true
					}
				);
			}
		} catch (err) {
			console.log('Transaction error: ', err);
		}
	}

	async function uploadFile(file: File): Promise<boolean> {
		if (connection && wallet) {
			try {
				console.log('connection', connection);
				toast.push('Uploading file to shadow drive...', { target: 'new' });
				const response = await getStorageAccounts(connection, wallet);
				if (response.length > 0) {
					const storage = response[0];
					const test = await uploadToShadowDrive(connection, wallet, storage.publicKey, file);
					console.log('Upload response', test);
					if (test.finalized_locations.length > 0) {
						shadowDriveUrl = test.finalized_locations[0];
						return true;
					} else {
						toast.push('Error uploading file to shadow drive!', { target: 'new' });
						return false;
					}
				} else {
					const createResponse = await createStorageAccount(connection, wallet);
					if (!createResponse.shdw_bucket) {
						toast.push('Error creating storage account!', { target: 'new' });
						return false;
					}
					const test = await uploadToShadowDrive(
						connection,
						wallet,
						new PublicKey(createResponse.shdw_bucket),
						file
					);
					console.log('Upload response', test);
					if (test.finalized_locations.length > 0) {
						shadowDriveUrl = test.finalized_locations[0];
						return true;
					} else {
						toast.push('Error uploading file to shadow drive!', { target: 'new' });
						return false;
					}
				}
			} catch (error) {
				console.error('Error uploading file:', error);
				return false;
			}
		}
		return false;
	}
	async function handleProposalSubmitted(event: any) {
		console.log('filegenerated', event);
		file = event.detail.file;
		proposal = event.detail.proposal;
		//TODO: Figure a way to combine two methods so its atomic?
		await uploadFile(file).then(async (res) => {
			toast.push(`File generated! <a href="${shadowDriveUrl}" target="_blank">here</a>`, {
				target: 'new'
			});
			if (res) {
				await createProposal();
			}
		});
	}
	onDestroy(unsubscribe);
</script>

<div class="wrap">
	<SvelteToast target="new" options={{ intro: { y: -64 } }} />
</div>
<div class="flex min-h-screen flex-col justify-center py-6 dark:prose-invert sm:py-12">
	<div class="relative py-3 sm:mx-auto sm:max-w-xl">
		<div
			class="bg-gray-0 relative mx-8 rounded-3xl px-4 py-10 shadow dark:bg-white sm:p-10 md:mx-0"
		>
			<div class="mx-auto max-w-md">
				<div class="flex items-center space-x-5">
					<div
						class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-yellow-200 font-mono text-2xl text-yellow-500"
					>
						MD
					</div>
					<div class="block self-start pl-2 text-xl font-semibold text-gray-700">
						<h2 class="leading-relaxed">Create a Proposal</h2>
						<p class="text-sm font-normal leading-relaxed text-gray-500">
							You can either upload a file or use the editor.
						</p>
					</div>
				</div>
				<ProposalForm on:submit-event={handleProposalSubmitted} />
			</div>
		</div>
	</div>
	<div class="toast-end toast">
		<div class="alert alert-info">
			<div>
				<span>$SHDW Balance: {shdwBalance.toFixed(2)}</span>
			</div>
		</div>
	</div>
</div>

<style>
	/* https://ryanmulligan.dev/blog/layout-breakouts/ */
	.votecontent {
		--gap: clamp(1rem, 6vw, 3rem);
		--full: minmax(var(--gap), 1fr);
		/* --content: min(65ch, 100% - var(--gap) * 2); */
		--content: 65ch;
		--popout: minmax(0, 2rem);
		--feature: minmax(0, 5rem);

		display: grid;
		grid-template-columns:
			[full-start] var(--full)
			[feature-start] 0rem
			[popout-start] 0rem
			[content-start] var(--content) [content-end]
			[popout-end] 0rem
			[feature-end] 0rem
			var(--full) [full-end];
	}

	@media (min-width: 768px) {
		.votecontent {
			grid-template-columns:
				[full-start] var(--full)
				[feature-start] var(--feature)
				[popout-start] var(--popout)
				[content-start] var(--content) [content-end]
				var(--popout) [popout-end]
				var(--feature) [feature-end]
				var(--full) [full-end];
		}
	}

	:global(.votecontent > *) {
		grid-column: content;
	}

	article :global(pre) {
		grid-column: feature;
		margin-left: -1rem;
		margin-right: -1rem;
	}
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
	/* hacky thing because otherwise the summary>pre causes overflow */
	article :global(summary > pre) {
		max-width: 90vw;
	}

	article :global(.popout) {
		grid-column: popout;
	}
	article :global(.feature) {
		grid-column: feature;
	}
	article :global(.full) {
		grid-column: full;
		width: 100%;
	}

	article :global(.admonition) {
		@apply border-4 border-red-500 p-8;
	}

	/* fix github codefence diff styling from our chosen prismjs theme */
	article :global(.token.inserted) {
		background: #00ff0044;
	}

	article :global(.token.deleted) {
		background: #ff000d44;
	}
</style>
