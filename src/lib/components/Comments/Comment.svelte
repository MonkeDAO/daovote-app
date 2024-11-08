<script lang="ts">
    import { formatDistanceToNow } from 'date-fns';
    import { chatUser } from '$lib/stores/chatUser';

    export let comment: {
        id: string;
        content: string;
        author: string;
        timestamp: number;
        walletAddress: string;
    };

    $: timeAgo = formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true });
    $: isAuthor = $chatUser?.walletAddress === comment.walletAddress;
</script>

<div class="flex gap-3 py-2">
    <div class="flex-1">
        <div class="flex items-center gap-2">
            <span class="font-bold">{comment.author}</span>
            <span class="text-xs opacity-60">{timeAgo}</span>
            {#if isAuthor}
                <span class="badge badge-sm">You</span>
            {/if}
        </div>
        <p class="mt-1 text-base-content/80 whitespace-pre-wrap">{comment.content}</p>
    </div>
</div> 