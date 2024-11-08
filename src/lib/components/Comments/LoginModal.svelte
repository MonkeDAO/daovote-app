<script lang="ts">
    import Gun from 'gun';
    import 'gun/sea';
    import { chatUser } from '$lib/stores/chatUser';
    import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
    import { toast } from '@zerodevx/svelte-toast';
    import type { IGunInstance, GunAck, GunUser } from '$lib/types/gun';
    import { signMessage } from '$lib/utils/wallet';

    export let showModal = false;
    let alias = '';
    let loading = false;
    
    const gun: IGunInstance = Gun({
        peers: [
            'https://gun-manhattan.herokuapp.com/gun',
            'https://gun-us.herokuapp.com/gun'
        ]
    });

    const USER_PATH = 'md-wallet-users';

    async function checkExistingWallet(): Promise<GunUser | null> {
        if (!$walletStore?.publicKey) return null;
        const walletAddress = $walletStore.publicKey.toString();
        
        return new Promise((resolve) => {
            gun.get(USER_PATH)
               .get(walletAddress)
               .once((data: GunUser | null) => {
                    console.log('Checking existing wallet:', { data, walletAddress });
                    resolve(data);
               });
        });
    }

    async function checkExistingAlias(alias: string): Promise<boolean> {
        return new Promise((resolve) => {
            gun.get(`~@${alias}`).once((data) => {
                console.log('Checking existing alias:', { data, alias });
                resolve(!!data);
            });
        });
    }

    async function handleClose() {
        showModal = false;
        alias = '';
    }

    async function handleLogin() {
        if (!$walletStore?.publicKey) {
            toast.push('Please connect your wallet first');
            return;
        }

        loading = true;
        const walletAddress = $walletStore.publicKey.toString();
        
        try {
            const existingUser = await checkExistingWallet();
            console.log('Login check:', { existingUser });
            
            if (!existingUser) {
                toast.push('No account found for this wallet. Please sign up first.');
                loading = false;
                return;
            }

            const signature = await signMessage(`Login-${existingUser.alias}`);
            console.log('Login signature:', signature);
            
            const user = gun.user();
            user.auth(existingUser.alias, signature, (ack: GunAck) => {
                console.log('Auth response:', ack);
                if (ack.err) {
                    toast.push('Login failed: ' + ack.err);
                    return;
                }
                
                toast.push(`Logged in as ${existingUser.alias}`);
                chatUser.set({
                    alias: existingUser.alias,
                    walletAddress,
                    gunId: user.is?.pub
                });
                handleClose();
            });
        } catch (err) {
            const error = err as Error;
            toast.push('Login failed: ' + error.message);
        } finally {
            loading = false;
        }
    }

    async function handleSignup() {
        if (!$walletStore?.publicKey) {
            toast.push('Please connect your wallet first');
            return;
        }

        loading = true;
        const walletAddress = $walletStore.publicKey.toString();

        try {
            const existingUser = await checkExistingWallet();
            console.log('Signup checks:', { existingUser });
            
            if (existingUser) {
                toast.push(`This wallet is already registered with alias "${existingUser.alias}". Please use login instead.`);
                loading = false;
                return;
            }

            const aliasExists = await checkExistingAlias(alias);
            if (aliasExists) {
                toast.push('This alias is already taken. Please choose another.');
                loading = false;
                return;
            }

            const signature = await signMessage(`Signup-${alias}`);
            console.log('Signup signature:', signature);

            const user = gun.user();
            user.create(alias, signature, async (ack: GunAck) => {
                console.log('Create response:', ack);
                if (ack.err) {
                    toast.push('Signup failed: ' + ack.err);
                    return;
                }

                gun.get(USER_PATH)
                   .get(walletAddress)
                   .put({
                       alias,
                       createdAt: Date.now()
                   });

                toast.push(`Successfully registered as ${alias}`);
                
                user.auth(alias, signature, (loginAck: GunAck) => {
                    if (loginAck.err) {
                        toast.push('Auto-login failed. Please try logging in manually.');
                        return;
                    }
                    
                    chatUser.set({
                        alias,
                        walletAddress,
                        gunId: user.is?.pub
                    });
                    handleClose();
                });
            });
        } catch (err) {
            const error = err as Error;
            toast.push('Signup failed: ' + error.message);
        } finally {
            loading = false;
        }
    }
</script>

<div class="modal" class:modal-open={showModal}>
    <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Set Chat Alias</h3>
        
        <div class="form-control gap-4">
            <input
                type="text"
                placeholder="Alias"
                class="input input-bordered"
                bind:value={alias}
                disabled={loading}
            />
            
            <div class="flex gap-2">
                <button 
                    class="btn btn-primary flex-1" 
                    on:click={handleLogin}
                    disabled={!alias || loading}
                >
                    {#if loading}
                        <span class="loading loading-spinner loading-sm"></span>
                    {:else}
                        Login
                    {/if}
                </button>
                <button 
                    class="btn flex-1"
                    on:click={handleSignup}
                    disabled={!alias || loading}
                >
                    {#if loading}
                        <span class="loading loading-spinner loading-sm"></span>
                    {:else}
                        Sign Up
                    {/if}
                </button>
            </div>
        </div>

        <div class="modal-action">
            <button class="btn btn-sm btn-ghost" on:click={handleClose}>Close</button>
        </div>
    </div>
</div> 