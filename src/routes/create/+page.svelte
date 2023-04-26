<script lang="ts">
	import 'prism-themes/themes/prism-shades-of-purple.min.css';
	import ProposalForm from '../../components/Proposal/ProposalForm.svelte';
	import { PublicKey, type Connection, Transaction } from '@solana/web3.js';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace } from '@svelte-on-solana/wallet-adapter-anchor';
	import { SvelteToast, toast } from '@zerodevx/svelte-toast'
	import { getStorageAccounts, uploadToShadowDrive } from '../../lib/drive';
	import { shdwBalanceStore } from '$lib/shdwbalance';
	import { onDestroy } from 'svelte';
	import { SYSTEM_PROGRAM_ID, TREASURY_ADDRESS, postDataToBuffer, proposalAccountPda, votebankAccountPda } from '$lib/utils/solana';
	let file: any;
	let proposal: any;
	let connection: Connection;
	let shadowDriveUrl: string;
	let wallet: any;
	let shdwBalance: number;
	$: if ($walletStore?.wallet?.publicKey && $workSpace?.provider?.connection) {
		connection = $workSpace.provider.connection;
		wallet = $walletStore.wallet;
	}
	const unsubscribe = shdwBalanceStore.subscribe(value => {
    	shdwBalance = value.balance;
  	});

	async function createProposal() {
      try {
		if ($workSpace.program && $walletStore.publicKey && $walletStore.signTransaction) {
		toast.push('Creating proposal...', { target: 'new' })
        /* interact with the program via rpc */
        console.log('Vote', $workSpace.baseAccount?.publicKey.toBase58());
		const [votebankAccount, _] = votebankAccountPda($workSpace.program.programId, 'MonkeDAO Voting');
		const voteBank = await $workSpace.program?.account.votebank.fetch(votebankAccount);
			
		let proposalId = 1;
		
		if (voteBank) {
			proposalId = voteBank.maxChildId as number;
		}
		const [proposalAccount, __] = proposalAccountPda(
        	$workSpace.program.programId,
        	votebankAccount,
        	proposalId
      	);
		console.log('Proposal account', proposalAccount.toBase58(), proposalId, JSON.stringify(voteBank.settings));

		//TODO figure out how to get the token mint from settings and use that instead of hardcoding
		const voteRestriction = (voteBank.settings as any[])?.find(obj => obj.hasOwnProperty('voteRestriction'));
		let tokenMint = new PublicKey('EDiRA7Xn4ZVN4wHDG4cyJh91avpRsPAY2nuLqKVBZ2Gt');
		let fetchMetadataAccounts = false;
		if (voteRestriction) {
			console.log('Vote restriction', voteRestriction);
			if (voteRestriction.voteRestriction.tokenOwnership) {
				tokenMint = new PublicKey(voteRestriction.voteRestriction.tokenOwnership.mint);
			}
			else if (voteRestriction.voteRestriction.nftOwnership) {
				tokenMint = new PublicKey(voteRestriction.voteRestriction.nftOwnership.collectionId);
				fetchMetadataAccounts = true;
			}
			//TODO: handle other types of restrictions
		}
		const splAccount = await $workSpace.provider?.connection.getParsedTokenAccountsByOwner($walletStore.publicKey, {
			mint: tokenMint
		});
		if (!splAccount) {
			toast.push('You need to have this token EDiRA7Xn4ZVN4wHDG4cyJh91avpRsPAY2nuLqKVBZ2Gt to create a proposal', { target: 'new' })
			return;
		}
		//TODO: validate there are tokenAccounts
		const splAccountInfo = splAccount.value[0].pubkey;
		const options = proposal.options.map((option: any) => {
			return { id: option.id, title: option.name };
		})
		/**
		 * Other type
		  {
		  	nftOwnership: {
				token_idx: 0,
				meta_idx: 1,
				collection_idx: 2,

		 	}
		*/
		const additionalAccountOffsets = [
        {
          tokenOwnership: {
            token_idx: 0,
          },
        },
      ];
      const tokenToAccountMetaFormat = {
        pubkey: splAccountInfo,
        isSigner: false,
        isWritable: true,
      };
		const postData = {
			title: proposal.title,
			summary: proposal.description,
			url: shadowDriveUrl,
		}
		console.log('Post data', postData);
        const ix = await $workSpace.program.methods
        .createProposal(
			options,
			Number(proposal.maxOptions),
			postDataToBuffer(postData),
			proposalId,
			[],
			additionalAccountOffsets,
		).accounts({
          proposal: proposalAccount,
          votebank: votebankAccount,
          poster: $walletStore.publicKey,
          treasury: TREASURY_ADDRESS,
          systemProgram: SYSTEM_PROGRAM_ID
        }).remainingAccounts([tokenToAccountMetaFormat]).instruction();
		const tx = new Transaction().add(ix);
		tx.feePayer = $walletStore.publicKey;
		tx.recentBlockhash = (await $workSpace.connection.getLatestBlockhash()).blockhash;
		var sig = await $walletStore.signTransaction(tx);

          sig?.verifySignatures();
          const signature = await $workSpace.connection.sendRawTransaction(
            tx.serialize()
          );
		  console.log('Signature', signature);
		const proposalCreatedAccount = await $workSpace.program.account.proposal.fetch(proposalAccount);
		console.log('Proposal created data', proposalCreatedAccount);
        toast.push(`Proposal created ${proposalAccount.toBase58()}`, {
            duration: 3000,
            pausable: true, 
        });
		}
      } catch (err) {
        console.log('Transaction error: ', err);
      }
    }

	async function uploadFile(file: File) {
		if (connection && wallet) {
			try {
				console.log('connection', connection);
				toast.push('Uploading file to shadow drive...',{ target: 'new' })
				const response = await getStorageAccounts(connection, wallet);
				if (response.length > 0) {
					const storage = response[0];
					const test = await uploadToShadowDrive(connection, wallet, storage.publicKey, file);
					console.log('Upload response', test);
					if (test.finalized_locations.length > 0) {
						shadowDriveUrl = test.finalized_locations[0];
					}
					else {
						toast.push('Error uploading file to shadow drive!', { target: 'new' });
					}
				}
				else {
					toast.push('Creating a storage account first...', { target: 'new' })
					const response = await getStorageAccounts(connection, wallet);
					const test = await uploadToShadowDrive(connection, wallet, response[0].publicKey, file);
					console.log('Upload response', test);
					if (test.finalized_locations.length > 0) {
						shadowDriveUrl = test.finalized_locations[0];
					}
					else {
						toast.push('Error uploading file to shadow drive!', { target: 'new' });
					}
				}
			} catch (error) {
				console.error('Error uploading file:', error);
			}
		}
	}
	async function handleProposalSubmitted(event: any) {
		console.log('filegenerated', event);
		file = event.detail.file;
		proposal = event.detail.proposal;
		
		await uploadFile(file).then(() => {
			toast.push(`File generated! <a href="${shadowDriveUrl}" target="_blank">here</a>`, { target: 'new' });
		}).then(async () => {
			await createProposal();
		});

	}
	onDestroy(unsubscribe);
</script>
<div class="wrap">
	<SvelteToast target="new" options={{ intro: { y: -64 } }} />
  </div>
  
<div class="mx-auto flex max-w-2xl">
	<div class="prose mb-8 max-w-full border-b border-t border-blue-800 p-4 dark:prose-invert">
		<ProposalForm on:submit-event={handleProposalSubmitted} />
	</div>
	<div class="toast toast-end">
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
