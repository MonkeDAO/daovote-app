<script lang="ts">
    import Gun from 'gun';
    import { onMount } from 'svelte';
    import { chatUser } from '$lib/stores/chatUser';
    import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
    import Comment from './Comment.svelte';
    import CommentInput from './CommentInput.svelte';
    import LoginModal from './LoginModal.svelte';
    import { toast } from '@zerodevx/svelte-toast';
    
    export let proposalId: string;
    export let votebankAddress: string;
    
    interface CommentType {
        id: string;
        content: string;
        author: string;
        timestamp: number;
        walletAddress: string;
    }

    let comments: CommentType[] = [];
    let showLoginModal = false;
    const commentPath = `${votebankAddress}_${proposalId}`;
    
    const gun = Gun({
        peers: [
            'https://gun-manhattan.herokuapp.com/gun',
            'https://gun-us.herokuapp.com/gun'
        ]
    });

    onMount(() => {
        gun.get('proposals')
           .get(commentPath)
           .get('comments')
           .map()
           .on((comment, id) => {
                if (comment) {
                    comments = [...comments.filter(c => c.id !== id), {
                        id,
                        content: comment.content,
                        author: comment.author,
                        timestamp: comment.timestamp,
                        walletAddress: comment.walletAddress
                    }].sort((a, b) => b.timestamp - a.timestamp);
                }
           });
    });

    function handleSubmit(content: string) {
        if (!$walletStore?.publicKey) {
            toast.push('Please connect your wallet first');
            return;
        }

        if (!$chatUser) {
            showLoginModal = true;
            return;
        }

        gun.get('proposals')
           .get(commentPath)
           .get('comments')
           .set({
                content,
                author: $chatUser.alias,
                timestamp: Date.now(),
                walletAddress: $chatUser.walletAddress
           });
    }
</script>

<div class="flex flex-col gap-4">
    <div class="flex justify-between items-center">
        <h3 class="text-lg font-bold">Comments</h3>
        {#if !$chatUser && $walletStore?.publicKey}
            <button 
                class="btn btn-sm btn-outline"
                on:click={() => showLoginModal = true}
            >
                Set Chat Alias
            </button>
        {/if}
    </div>

    {#if $walletStore?.publicKey}
        <CommentInput handleSubmit={handleSubmit} />
    {:else}
        <div class="alert">
            <span>Please connect your wallet to comment</span>
        </div>
    {/if}

    <div class="comments-list divide-y divide-base-content/20">
        {#each comments as comment (comment.id)}
            <Comment {comment} />
        {/each}
    </div>
</div>

<LoginModal bind:showModal={showLoginModal} />