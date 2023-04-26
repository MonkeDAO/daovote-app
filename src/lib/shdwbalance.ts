import { writable } from 'svelte/store';
import { Connection, PublicKey } from '@solana/web3.js';

function declareShdwBalanceStore() {
    const { subscribe, set } = writable({ balance: 0 });

    return {
        subscribe,
        getShdwBalance: async (publicKey: PublicKey, connection: Connection) => {
            if (!connection) {
                return 0;
            }
            let balance = 0;
            try {
                const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, { mint: new PublicKey('SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y') },  'confirmed');
                if (tokenAccounts.value.length > 0) {
                    const filtered = tokenAccounts.value.find((account) => {
                        return account.account.data.parsed.info.tokenAmount.uiAmount > 0;
                    })
                    if (filtered) {
                        balance = filtered.account.data.parsed.info.tokenAmount.uiAmount;
                    }
                }
                else {
                    balance = 0;
                }
                set({ balance });
            } catch (e) {
                console.log(`error getting balance: `, e);
            }
        }
    };
}

export const shdwBalanceStore = declareShdwBalanceStore();