<script lang="ts">
    import Gun from 'gun';
    import 'gun/sea';
    import { chatUser } from '$lib/stores/chatUser';
    import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
    import { toast } from '@zerodevx/svelte-toast';
    import type { IGunInstance, GunAck, GunUser } from '$lib/types/gun';
    import { signMessage } from '$lib/utils/wallet';
    import { nftStore, nftSyncStore, nftWalletDisconnectListener } from '$lib/stores/nftStore';
	import { PUBLIC_COLLECTION_ADDRESSES, PUBLIC_SOLANA_NETWORK, PUBLIC_VOTEBANK } from '$env/static/public';

    export let showModal = false;
    let alias = '';
    let loading = false;
    let nftLoading = true;
    let existingUserData: GunUser | null = null;
    
    const gun: IGunInstance = Gun({
        peers: [
            'https://gun-manhattan.herokuapp.com/gun',
            'https://gun-us.herokuapp.com/gun'
        ]
    });

    const USER_PATH = `1${PUBLIC_SOLANA_NETWORK}-${PUBLIC_COLLECTION_ADDRESSES}-${PUBLIC_VOTEBANK}-users`;

    // Subscribe to both stores to handle wallet changes and disconnects
    $: {
        $nftSyncStore; // Handle wallet changes
        $nftWalletDisconnectListener; // Handle wallet disconnects
        nftLoading = $nftStore.isFetching;
    }

    // Update wallet check to handle disconnects
    $: if (!$walletStore?.wallet?.connected) {
        existingUserData = null;
        alias = '';
    } else if (showModal && $walletStore?.publicKey) {
        checkExistingWallet().then(user => {
            existingUserData = user;
            if (user?.alias) {
                alias = user.alias;
            }
        });
    }

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
        existingUserData = null;
    }

    async function checkNftOwnership(): Promise<boolean> {
        if (!$walletStore?.wallet?.connected) return false;
        
        if (nftLoading) {
            toast.push('Please wait while we check your NFTs...');
            return false;
        }

        const nfts = $nftStore.data;
        if (!nfts) return false;

        return nfts.some(nft => 
            nft.collection?.address === PUBLIC_COLLECTION_ADDRESSES
        );
    }

    function getSignatureMessage(alias: string): string {
        return `Sign in to MonkeDAO Chat as ${alias}`;
    }

    async function handleLogin() {
        if (!$walletStore?.publicKey) {
            toast.push('Please connect your wallet first');
            return;
        }

        loading = true;
        const walletAddress = $walletStore.publicKey.toString();
        
        try {
            const hasNft = await checkNftOwnership();
            if (!hasNft) {
                toast.push('You need to own a MonkeDAO NFT to participate in chat');
                loading = false;
                return;
            }

            const existingUser = await checkExistingWallet();
            console.log('Login check:', { existingUser });
            
            if (!existingUser) {
                toast.push('No account found for this wallet. Please sign up first.');
                loading = false;
                return;
            }

            const signature = await signMessage(getSignatureMessage(existingUser.alias));
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
            // Check NFT ownership first
            const hasNft = await checkNftOwnership();
            if (!hasNft) {
                toast.push('You need to own a MonkeDAO NFT to participate in chat');
                loading = false;
                return;
            }

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

            const signature = await signMessage(getSignatureMessage(alias));
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
        <h3 class="font-bold text-lg mb-4">
            {#if existingUserData}
                Welcome Back, {existingUserData.alias}
            {:else}
                Set Chat Alias
            {/if}
        </h3>
        
        {#if nftLoading}
            <div class="flex flex-col items-center justify-center p-4">
                <span class="loading loading-spinner loading-lg"></span>
                <p class="mt-2">Checking NFT ownership...</p>
            </div>
        {:else}
            <div class="form-control gap-4">
                <input
                    type="text"
                    placeholder="Alias"
                    class="input input-bordered"
                    bind:value={alias}
                    disabled={loading || !!existingUserData}
                />
                
                <div class="flex gap-2">
                    {#if existingUserData}
                        <!-- Show only login when user exists -->
                        <button 
                            class="btn btn-primary flex-1" 
                            on:click={handleLogin}
                            disabled={!alias || loading || nftLoading}
                        >
                            {#if loading}
                                <span class="loading loading-spinner loading-sm"></span>
                            {:else}
                                Login
                            {/if}
                        </button>
                    {:else}
                        <!-- Show both options for new users -->
                        <button 
                            class="btn btn-primary flex-1" 
                            on:click={handleLogin}
                            disabled={!alias || loading || nftLoading}
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
                            disabled={!alias || loading || nftLoading}
                        >
                            {#if loading}
                                <span class="loading loading-spinner loading-sm"></span>
                            {:else}
                                Sign Up
                            {/if}
                        </button>
                    {/if}
                </div>
            </div>
        {/if}

        <div class="modal-action">
            {#if existingUserData}
                <button 
                    class="btn btn-sm btn-ghost"
                    on:click={() => {
                        existingUserData = null;
                        alias = '';
                    }}
                >
                    Use Different Alias
                </button>
            {/if}
            <button class="btn btn-sm btn-ghost" on:click={handleClose}>Close</button>
        </div>
    </div>
</div> 