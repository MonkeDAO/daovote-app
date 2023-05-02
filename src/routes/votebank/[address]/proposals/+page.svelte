<script lang="ts">
	import GeneralCard from '$lib/components/GeneralCard.svelte';
	import type { CardItem, ProposalItem } from '$lib/types';
	import 'prism-themes/themes/prism-shades-of-purple.min.css';
	import { onMount } from 'svelte';
	
    export let data: any;
    let open_proposals: ProposalItem[] = [];
    let closed_proposals: ProposalItem[] = [];
    let loading = true;
    let currentTab = 'open';
    $: if(data) {
        open_proposals = data.json.open_proposals;
        closed_proposals = data.json.closed_proposals;
        loading = false;
    }
    function mapItemToCardItem(item: ProposalItem): CardItem {
      return {
        title: item.data.title,
        description: item.data.summary,
        url: `/votebank/${item.votebank}/proposal/${item.proposalId}`,

      }
    }

</script>
<!-- ... -->

<style>
    @media (min-width: 640px) {
      .cards-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }
  </style>
  
  <div class="container mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
    <h3 class="text-center mb-6 text-2xl font-bold tracking-tight text-black dark:text-white md:text-4xl">
      Proposals
    </h3>
    <div class="flex justify-center mb-6">
        <button
          class="btn btn-outline btn-wide mx-1 px-1 sm:px-4"
          class:active="{currentTab === 'open'}"
          on:click="{() => (currentTab = 'open')}"
        >
          Open
        </button>
        <button
          class="btn btn-outline btn-wide mx-1 px-1 sm:px-4"
          class:active="{currentTab === 'closed'}"
          on:click="{() => (currentTab = 'closed')}"
        >
          Closed
        </button>
      </div>
    <section class="mb-16 w-full">
      {#if currentTab === 'open'}
        {#if loading}
          <div class="flex justify-center items-center">
            <progress class="progress w-56" />
          </div>
        {:else}
          {#if open_proposals.length > 0}
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 place-items-center w-full">
              {#each open_proposals as item (item)}
                <GeneralCard item={mapItemToCardItem(item)} />
              {/each}
            </div>
          {:else}
            <div class="flex justify-center items-center">
              <p class="text-gray-500">No open proposals</p>
            </div>
          {/if}
        {/if}
      {:else}
        {#if loading}
          <div class="flex justify-center items-center">
            <div class="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        {:else}
          {#if closed_proposals.length > 0}
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full">
              {#each closed_proposals as item (item)}
                <GeneralCard item={mapItemToCardItem(item)} />
              {/each}
            </div>
          {:else}
            <div class="flex justify-center items-center">
              <p class="text-gray-500">No closed proposals</p>
            </div>
          {/if}
        {/if}
      {/if}
    </section>
  </div>
  
  
