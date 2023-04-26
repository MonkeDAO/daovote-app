<script lang="ts">
	import 'prism-themes/themes/prism-shades-of-purple.min.css';
	import ProposalForm from '../../components/Proposal/ProposalForm.svelte';
	import type { Connection } from '@solana/web3.js';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace } from '@svelte-on-solana/wallet-adapter-anchor';
	import { SvelteToast, toast } from '@zerodevx/svelte-toast'
	import { getStorageAccounts, uploadToShadowDrive } from '../../lib/drive';
	let file: any;
	let connection: Connection;
	let shadowDriveUrl: string;
	let wallet: any;
	$: if ($walletStore?.wallet?.publicKey && $workSpace?.provider?.connection) {
		connection = $workSpace.provider.connection;
		wallet = $walletStore.wallet;
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
		
		await uploadFile(file).then(() => {
			toast.push(`File generated! <a href="${shadowDriveUrl}" target="_blank">here</a>`, { target: 'new' });
		});

	}
</script>
<div class="wrap">
	<SvelteToast target="new" options={{ intro: { y: -64 } }} />
  </div>
  
<div class="mx-auto max-w-2xl">
	<div class="prose mb-12 max-w-full border-b border-t border-blue-800 p-4 dark:prose-invert">
		<ProposalForm on:submit-event={handleProposalSubmitted} />
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
