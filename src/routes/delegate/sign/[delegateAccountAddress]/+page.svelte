<script lang="ts">
	import type { DelegateAccount } from "$lib/anchor/accounts";
    import { createSignDelegateAddressInstruction } from '$lib/anchor/instructions/signDelegateAddress';
    import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
    import { walletProgramConnection } from '$lib/wallet';
    import { web3 } from '@project-serum/anchor';
    import { toast } from '@zerodevx/svelte-toast';
    import { loading as loadingStore } from '$lib/stores/loadingStore';
    import { message } from '$lib/stores/messageStore';
    import { extractCustomCodes, sleep } from '$lib/utils/solana';
	import { workSpace } from "@svelte-on-solana/wallet-adapter-anchor";
	import type { Adapter } from "@solana/wallet-adapter-base";
	import type { Connection, PublicKey } from "@solana/web3.js";
	import { createRevokeDelegateAddressInstruction } from "$lib/anchor/instructions/revokeDelegateAddress";
    import { faPenFancy, faSignOut, faCopy } from '@fortawesome/free-solid-svg-icons';
	import LoadingOverlay from "$lib/components/LoadingOverlay.svelte";
	import { goto } from "$app/navigation";
	import Fa from "svelte-fa";
    import { page } from '$app/stores';
   
    export let data: {
        delegateAccount: DelegateAccount | null,
        delegateAccountAddress: string | null,
        signature: string | null,
    };
    let connection: Connection;
    let currentUser: PublicKey;
    let isOwner: boolean;
    let isOwnerSigned: boolean;
    let owner: string;
    let loading = true;
    let ready: boolean;
    let tooltipMessage = "Copy";
    const walletConnectionFactory = walletProgramConnection(walletStore, workSpace);

    $: {
        ready = $walletConnectionFactory.ready;
        if (ready && $walletConnectionFactory.connection) {
            connection = $walletConnectionFactory.connection;
        }
        if (ready && $walletConnectionFactory.wallet) {
        }
        if (ready && $walletConnectionFactory.program) {
        }
        if (ready && $walletConnectionFactory.publicKey) {
            currentUser = $walletConnectionFactory.publicKey;
        }
    }

    $: if (data && data.delegateAccount && data.delegateAccount.accounts && currentUser) {
        isOwner = data.delegateAccount.accounts.some(account => account.address.toBase58() === currentUser.toBase58());
        loading = false;
    }
    $: if (data && data.delegateAccount && data.delegateAccount.delegateOwner) {
        owner = data.delegateAccount.delegateOwner.toString();
    }

    $: if (data && data.delegateAccount && data.delegateAccount.accounts && currentUser) {
        isOwnerSigned = data.delegateAccount.accounts.some(account => account.address.toBase58() === currentUser.toBase58() && account.signed);
    }

    const processTransaction = async (instructionCreator: (args: { delegateAccount: web3.PublicKey, signer: PublicKey, systemProgram: PublicKey }) => web3.TransactionInstruction) => {
        if (!data.delegateAccountAddress) {
            return;
        }
        if (!isOwner) {
            toast.push("You are not the owner of this delegate account");
            return;
        }
        loadingStore.set(true);
        const ix = instructionCreator(
            {
                delegateAccount: new web3.PublicKey(data.delegateAccountAddress),
                signer: currentUser,
                systemProgram: web3.SystemProgram.programId
            }
        );
        const tx = new web3.Transaction().add(ix);
        tx.feePayer = currentUser;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        message.set('Simulating transaction...');
        const t = await connection.simulateTransaction(tx);
        if (t.value.err) {
            const messages = extractCustomCodes(t.value.err);
            if (messages.length > 0) {
                const msgString = messages.join(', ');
                message.set(`Error: ${msgString}`);
                setTimeout(() => {
                    reset();
                }, 2000);
                return;
            }
        }
        message.set('Waiting for signature...');
        const signature = await $walletStore.sendTransaction(tx, connection);
        const latestBlockhash = await connection.getLatestBlockhash();

        await connection.confirmTransaction(
            {
                signature: signature,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
                blockhash: latestBlockhash.blockhash
            },
            'confirmed'
        );
        message.set('Success!');
        await sleep(2000);
        goto(`/delegate/sign/${data.delegateAccountAddress}?signature=${signature}`, { replaceState: true, invalidateAll: true });
        reset();
    };

    const signDelegateAccount = async () => {
        await processTransaction(createSignDelegateAddressInstruction);
    };

    const revokeDelegateAddress = async () => {
        await processTransaction(createRevokeDelegateAddressInstruction);
    };

    function copyToClipboard(text: string) {
        const el = document.createElement('textarea');  
        el.value = text;                               
        document.body.appendChild(el);                
        el.select();                                   
        document.execCommand('copy');                 
        document.body.removeChild(el);                
            tooltipMessage = "Copied!";
        setTimeout(() => {
            tooltipMessage = "Copy to clipboard"; // Reset the message after a delay
        }, 1500);
    };

    function reset() {
        loadingStore.set(false);
        message.set('');
    }
    
</script>
<LoadingOverlay />
<section class="container mx-auto px-6 sm:px-8 lg:px-10 py-7">
    <div class="bg-white shadow sm:rounded-lg max-w-3xl mx-auto p-8">
        {#if !data || !data.delegateAccount}
            <div class="mb-5">
                <h2 class="text-2xl font-semibold text-gray-900">Not Found</h2>
                <p class="text-sm text-gray-600">{$page.data?.error || 'No delegate account found.'}</p>
            </div>
        {/if}
        {#if data && data.delegateAccount}
            <div class="mb-5">
                <h2 class="text-2xl font-semibold text-gray-900">Delegate</h2>
                <div class="flex items-center mt-2">
                    <h3 class="text-xl text-gray-800">{owner}</h3>
                    <div class="tooltip ml-2" data-tip={tooltipMessage}>
                        <button class="btn-ghost btn btn-sm text-gray-900 focus:outline-none" on:click={() => copyToClipboard(owner)}>
                            <Fa icon={faCopy} class="text-gray-600 hover:text-gray-800" />
                        </button>
                    </div>
                </div>
                <p class="text-sm text-gray-600 mt-2">The owner address will be allowed to vote with any of the addresses below that approved delegation.</p>
            </div>
            <div class="overflow-x-auto mx-auto">
                {#if data.delegateAccount.accounts.length > 0}
                <table class="table table-md text-gray-600 mx-auto max-w-xl">
                    <thead>
                        <tr>
                            <th class="bg-gray-200">Address</th>
                            <th class="bg-gray-200">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.delegateAccount.accounts as account (account.address)}
                            <tr class="">
                                <td class="bg-gray-300">{account.address}</td>
                                <td class="bg-gray-300">
                                    <div class="flex items-start text-sm text-gray-600 dark:text-gray-400">
                                        {#if account.signed}
                                            <div class="badge-success badge">Signed</div>
                                        {:else}
                                            <div class="badge-error badge">Missing Signer</div>
                                        {/if}
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
                {:else}
                    <p class="text-gray-900">Delegation is enabled but no addresses added yet.</p>
                {/if}
            </div>
            {#if isOwner}
            <div class="flex items-end justify-end mt-5 space-x-4">
                <button class="btn-primary btn btn-md text-gray-100 flex items-center" on:click={signDelegateAccount} disabled={!isOwner || loading || isOwnerSigned}>
                    <Fa icon={faPenFancy} class="mr-2 ml-1" />
                    {isOwnerSigned ? 'Signed' : 'Sign to approve'}
                </button>
            
                <button class="btn-error btn btn-md text-gray-100 flex items-center" on:click={revokeDelegateAddress} disabled={!isOwner || loading || !isOwnerSigned}>
                    <Fa icon={faSignOut} class="mr-2 ml-1" />
                    {isOwnerSigned ? 'Revoke' : 'Revoked'}
                </button>
            </div>
            {/if}
            {#if !isOwner}
				<p class="relative rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700 mt-4">
					The wallet connected cannot sign for any of these addresses. Please connect the wallet that owns one of these addresses to approve delegation
				</p>
			{/if}

        {/if}
    </div>
</section>


