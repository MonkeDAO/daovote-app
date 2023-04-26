
import { writable } from 'svelte/store';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

function declareBalanceStore() {
    const { subscribe, set } = writable({ balance: 0 });

    return {
        subscribe,
        // @ts-ignore
        getUserSOLBalance: async (publicKey: PublicKey, connection: Connection) => {
            if (!connection) {
                return 0;
            }
            let balance = 0;
            try {
                balance = await connection.getBalance(publicKey, 'confirmed');
                balance = balance / LAMPORTS_PER_SOL;
                set({ balance });
            } catch (e) {
                console.log(`error getting balance: `, e);
            }
        }
    };
}

export const balanceStore = declareBalanceStore();