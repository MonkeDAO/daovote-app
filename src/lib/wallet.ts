import { type Readable, derived } from 'svelte/store';
import type { WalletStore } from '@svelte-on-solana/wallet-adapter-core';
import type { WorkSpace } from '@svelte-on-solana/wallet-adapter-anchor';
import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js';

export const walletProgramConnection = (
	walletStore: Readable<WalletStore>,
	workSpace: Readable<WorkSpace>
) => {
	return derived([walletStore, workSpace], ([$walletStore, $workSpace]) => {
		return {
			connection: $workSpace?.provider?.connection || null,
			wallet: $walletStore?.wallet || null,
			ready: !!($walletStore?.wallet && $workSpace?.provider?.connection && $workSpace?.program),
			program: $workSpace?.program || null,
			publicKey: $walletStore?.publicKey || null,
			metaplex:
				$workSpace?.provider?.connection && $walletStore.wallet
					? Metaplex.make($workSpace.provider.connection).use(
							walletAdapterIdentity($walletStore.wallet)
					  )
					: null
		};
	});
};
