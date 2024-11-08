import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
import { get } from 'svelte/store';

export async function signMessage(message: string): Promise<string> {
    const wallet = get(walletStore);
    if (!wallet?.signMessage) throw new Error('Wallet does not support message signing');
    
    const messageBytes = new TextEncoder().encode(message);
    const signature = await wallet.signMessage(messageBytes);
    return Buffer.from(signature).toString('base64');
} 