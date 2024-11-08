import { writable, derived } from 'svelte/store';
import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
import type { IGunInstance } from '$lib/types/gun';

interface ChatUser {
    alias: string;
    walletAddress: string;
    gunId?: string;
}

function createChatUserStore() {
    const { subscribe, set, update } = writable<ChatUser | null>(null);

    return {
        subscribe,
        set,
        reset: () => set(null),
        async checkExistingUser(gun: IGunInstance, walletAddress: string) {
            return new Promise((resolve) => {
                gun.get('wallet-users')
                    .get(walletAddress)
                    .once((data: any) => {
                        resolve(data);
                    });
            });
        }
    };
}

export const chatUser = createChatUserStore();

// Reset chat user when wallet disconnects
derived(walletStore, $wallet => $wallet?.connected).subscribe(connected => {
    if (!connected) {
        chatUser.reset();
    }
});