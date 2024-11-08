<script lang="ts">
    import { chatUser } from '$lib/stores/chatUser';
    
    export let handleSubmit: (content: string) => void;
    let content = '';
    let rows = 1;
    
    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (content.trim()) {
                handleSubmit(content);
                content = '';
            }
        }
    }

    $: if (content) {
        rows = content.split('\n').length;
        if (rows > 5) rows = 5;
    } else {
        rows = 1;
    }
</script>

<div class="flex gap-3 py-4">
    <div class="flex-1">
        <textarea
            bind:value={content}
            {rows}
            placeholder="Write a comment..."
            class="textarea textarea-bordered w-full resize-none"
            on:keydown={handleKeydown}
        />
        <div class="flex justify-between items-center mt-2">
            <span class="text-xs opacity-60">
                Press Shift + Enter for new line
            </span>
            <button 
                class="btn btn-primary btn-sm"
                disabled={!content.trim()}
                on:click={() => {
                    if (content.trim()) {
                        handleSubmit(content);
                        content = '';
                    }
                }}
            >
                Post
            </button>
        </div>
    </div>
</div> 