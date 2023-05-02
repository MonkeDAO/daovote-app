<script lang="ts">
	import 'prism-themes/themes/prism-shades-of-purple.min.css';
	import { PublicKey, type Connection } from '@solana/web3.js';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace } from '@svelte-on-solana/wallet-adapter-anchor';
	import { onMount } from 'svelte';
	import type { VoteBankItem } from '$lib/types';
	import GeneralCard from '$lib/components/GeneralCard.svelte';
	export let data: any;
	let connection: Connection;
	let wallet: any;
	let votebankItems: VoteBankItem[] = [];
	let banks: string[];
	$: if ($walletStore?.wallet?.publicKey && $workSpace?.provider?.connection) {
		connection = $workSpace.provider.connection;
		wallet = $walletStore.wallet;
	}
	$: if (data) {
		banks = data.vbanks;
	}
    $: if (wallet && connection && banks) {
        fetchAllBanks();
    }

    function mapItemToCardItem(item: VoteBankItem) {
        return {
            title: item.title,
            description: item.description,
            url: `/votebank/${item.votebank}`,
        }
    }

	async function fetchAllBanks() {
		if (wallet && connection && $workSpace.program && banks) {
			console.log('fetching all banks');
			const bankPublicKeys = banks.map((x) => new PublicKey(x));
			const votebanks = await Promise.all(
				bankPublicKeys.map((publicKey) => $workSpace.program?.account.votebank.fetch(publicKey))
			);
			console.log('votebanks fetched', votebanks);

			votebankItems = votebanks
				.map((votebank, index) => {
					if (!votebank) {
						return null;
					}
					//@ts-ignore
					const title = votebank.settings.find((setting) => setting?.description?.title)
						?.description.title;
					//@ts-ignore
					const desc = votebank.settings.find((setting) => setting?.description?.desc)?.description
						.desc;
					const votebankPublicKey = bankPublicKeys[index].toBase58();
					return {
						votebank: votebankPublicKey,
						title: title,
						description: desc
					} as VoteBankItem;
				})
				.filter((item) => item !== null) as VoteBankItem[];
			console.log('votebanks fetched', votebanks);
			// .then((data) => {
			//     let votebankItem: VoteBankItem[] = [];
			//     if (data) {
			//         for (let acct of data) {
			//         const { title, desc } = acct.settings.find(x => x.description)?.description;
			//         votebankItem.push({
			//             votebank: '',
			//             title: title as string,
			//             description: desc as string,
			//         });
			//     }
			//     }

			// })
			// .catch(async (err) => {
			//     console.log(err);
			//     let votebankItem: VoteBankItem[] = [];
			//     const voteBank = Votebank.gpaBuilder()
			//     const test = await voteBank.run(connection);
			//     for (let acct of test) {
			//         const data = await $workSpace.program?.account.votebank.fetch(acct.pubkey).catch((err) => {
			//         console.log(err);
			//      });
			//     if (data) {
			//         console.log('data found', data, acct)
			//         const { title, desc } = data.settings.find(x => x.description)?.description;
			//         votebankItem.push({
			//             votebank: acct?.pubkey?.toBase58() ?? '',
			//             title: title as string,
			//             description: desc as string,
			//         })
			//     return votebankItem;
			//     }
			//     console.log(data);
			// }
			// })
			// console.log('test', votebanks);

			// if (votebanks) {
			//     votebankItems = votebanks;
			// }
		}
	}
</script>

<div class="container mx-auto px-4">
	<div class="my-8">
		<div class="flex justify-center">
			<h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">Votebanks</h1>
		</div>
	</div>
	{#if votebankItems}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{#each votebankItems as votebankItem}
				<GeneralCard item={mapItemToCardItem(votebankItem)} />
			{/each}
		</div>
	{/if}
</div>