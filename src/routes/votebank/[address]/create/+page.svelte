<script lang="ts">
	import 'prism-themes/themes/prism-shades-of-purple.min.css';
	import ProposalForm from '../../../../lib/components/Proposal/ProposalForm.svelte';
	import { PublicKey, type Connection, Transaction } from '@solana/web3.js';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace } from '@svelte-on-solana/wallet-adapter-anchor';
	import { SvelteToast, toast } from '@zerodevx/svelte-toast';
	import { createStorageAccount, getStorageAccounts, uploadToShadowDrive } from '$lib/drive';
	import { shdwBalanceStore } from '$lib/shdwbalance';
	import { toBigNumber, type Metaplex } from '@metaplex-foundation/js';
	import { onDestroy } from 'svelte';
	import { walletProgramConnection } from '$lib/wallet';
	import {
		SYSTEM_PROGRAM_ID,
		TREASURY_ADDRESS,
		extractCustomCodes,
		extractRestrictionData,
		getDefaultPublicKey,
		getExplorerUrl,
		isDefaultPublicKey,
		postDataToBuffer,
		proposalAccountPda,
		sleep,
		toAccountMetadata
	} from '$lib/utils/solana';
	import type { Program } from '@project-serum/anchor';
	import { getAssociatedTokenAddress } from '@solana/spl-token';
	import { Votebank } from '$lib/anchor/accounts';
	import type { SettingsData } from '$lib/anchor/types';
	import type { NftMetadata } from '$lib/types';
	import { nftStoreUser } from '$lib/stores/nftStoreUser';
	import { nftSyncStore } from '$lib/stores/nftStore';
	import { message } from '$lib/stores/messageStore';
	import { loading as loadingStore } from '$lib/stores/loadingStore';
	import { PUBLIC_SOLANA_NETWORK } from '$env/static/public';
	import { reset, setMessageSlow } from '$lib/utils/common';

	export let data: any;
	let nfts: NftMetadata[];
	let file: any;
	let votebankAddress: PublicKey;
	let proposal: any;
	let connection: Connection;
	let currentUser: PublicKey;
	let metaplex: Metaplex;
	let program: Program;
	let shadowDriveUrl: string = '';
	let wallet: any;
	let shdwBalance: number;
	let ready: boolean;
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
		console.log('Derived store updated:', $walletConnectionFactory, $nftWallet);
	}
	$: if (data.address) {
		votebankAddress = new PublicKey(data.address);
	}
	const unsubscribe = shdwBalanceStore.subscribe((value) => {
		shdwBalance = value.balance;
	});

	$: {
		if ($nftWallet.nfts) {
			nfts = $nftWallet.nfts;
		}
		$nftSyncStore; // access nftSyncStore
	}

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
				message.set('Creating proposal...');
				/* interact with the program via rpc */
				console.log('Vote', $workSpace.baseAccount?.publicKey.toBase58());
				const voteBankAccountRaw = await Votebank.fromAccountAddress(connection, votebankAddress);
				//@ts-ignore
				const description = (voteBankAccountRaw.settings as SettingsData[]).find(
					(x) => x.__kind == 'Description'
				);
				let title = '';
				if (description) {
					const { title: settingsTitle } = description as any;
					title = settingsTitle;
				}
				let proposalId = 1;

				if (voteBankAccountRaw) {
					proposalId = voteBankAccountRaw.maxChildId as number;
				}
				const [proposalAccount] = proposalAccountPda(
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
					title
				);

				const settings = voteBankAccountRaw.settings as SettingsData[];
				const { restrictionMint, isNftRestricted, restrictionIx, ruleKind } =
					extractRestrictionData(settings);
				let nftMint = getDefaultPublicKey();
				let nftMintMetadata = getDefaultPublicKey();
				let tokenAccount = getDefaultPublicKey();
				let additionalAccountOffsets: any = null; //needs to be null to serialize if offsets not needed
				if (isNftRestricted) {
					// Find by collection id:
					nfts.find((nft) => {
						if (nft.collection && nft.collection.address === restrictionMint.toBase58()) {
							nftMint = new PublicKey(nft.address); //(nft as any)['mintAddress'];
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
				const endDateTimeStamp = Date.parse(proposal.endDate) / 1000;
				console.log(
					'Post data',
					postData,
					additionalAccountOffsets,
					tokenToAccountMetaFormat,
					endDateTimeStamp
				);
				const ix = await program.methods
					.createProposal(
						options,
						Number(proposal.maxOptions),
						postDataToBuffer(postData),
						proposalId,
						[], //TODO: add settings if needed?
						additionalAccountOffsets,
						toBigNumber(endDateTimeStamp)
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
				message.set('Confirming transaction...');
				await connection.confirmTransaction(
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
				message.set('Proposal created!');
				const explorerUrl = `${getExplorerUrl(PUBLIC_SOLANA_NETWORK, 'transaction', signature)}`;
				toast.push(
					`Proposal created <a href="/votebank/${votebankAddress}/proposal/${proposalId}" target="_blank">View proposal</a> </br> <a href="${explorerUrl}" target="_blank">View on Solana Explorer</a>`,
					{
						target: 'new',
						duration: 3000,
						pausable: true
					}
				);
				setTimeout(() => reset(), 1500);
			}
		} catch (err) {
			console.log('Transaction error: ', err);
			message.set('Error creating proposal!');
			setTimeout(() => reset(), 2000);
		}
	}

	async function uploadFile(file: File): Promise<boolean> {
		if (connection && wallet) {
			try {
				console.log('connection', connection);
				message.set('Uploading file to shadow drive...');
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
					message.set('No storage account found, creating one...');
					const createResponse = await createStorageAccount(connection, wallet);
					if (!createResponse.shdw_bucket) {
						toast.push('Error creating storage account!', { target: 'new' });
						return false;
					}
					message.set('Storage account created, uploading file...');
					const test = await uploadToShadowDrive(
						connection,
						wallet,
						new PublicKey(createResponse.shdw_bucket),
						file
					);

					console.log('Upload response', test);
					if (test.finalized_locations.length > 0) {
						message.set('File uploaded!');
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
		const skipUpload = event.detail.skipUpload;
		loadingStore.set(true);
		if (file && shdwBalance < 0.05) {
			setMessageSlow('You do not have enough shdw to upload a file. You need at least 0.05 SHDW', 1000);
			reset();
			return;
		} 
		if (skipUpload) {
			await createProposal();
		} else {
			await uploadFile(file).then(async (res) => {
				if (res) {
					toast.push(`File generated! <a href="${shadowDriveUrl}" target="_blank">here</a>`, {
					target: 'new'
					});
					await createProposal();
				}
				else {
					message.set('Error uploading file!');
				}
			});
		}
		//TODO: Figure a way to combine two methods so its atomic?
	}
	
	onDestroy(unsubscribe);
</script>

<div class="wrap">
	<SvelteToast target="new" options={{ intro: { y: -64 } }} />
</div>
<div class="flex min-h-screen flex-col justify-center dark:prose-invert sm:py-12">
	<div class="relative sm:mx-auto sm:max-w-xl">
		<div class="bg-gray-0 relative mx-8 rounded-3xl px-4 shadow dark:bg-white sm:p-10 md:mx-0">
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
							You need $SHDW to create a proposal with files.
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
