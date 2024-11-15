<script lang="ts">
    // Optional props for customization
    export let showProgress = true;
</script>

<div class="card w-full md:w-[24rem] bg-base-100 shadow-xl animate-pulse">
    <div class="card-body">
        <!-- Title skeleton -->
        <div class="h-7 w-3/4 bg-base-300 rounded-lg mb-4"></div>
        
        <!-- Description skeleton -->
        <div class="space-y-3 mb-6">
            <div class="h-4 w-full bg-base-300 rounded"></div>
            <div class="h-4 w-5/6 bg-base-300 rounded"></div>
            <div class="h-4 w-4/6 bg-base-300 rounded"></div>
        </div>
        
        <!-- Progress section skeleton -->
        {#if showProgress}
            <div class="mt-auto space-y-2">
                <div class="flex justify-between">
                    <div class="h-4 w-1/3 bg-base-300 rounded"></div>
                    <div class="h-4 w-1/4 bg-base-300 rounded"></div>
                </div>
                <div class="h-2.5 w-full bg-base-300 rounded-full"></div>
            </div>
        {/if}
    </div>
</div> 