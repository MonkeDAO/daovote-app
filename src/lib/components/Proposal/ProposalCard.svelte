<script lang="ts">
	import type { ProposalItem } from "$lib/types";

	export let item: ProposalItem;
</script>

<a
  class="transform rounded-xl bg-gradient-to-r from-purple-400 via-blue-500 to-green-200 p-1 transition-all hover:scale-[1.01] w-full md:w-auto md:max-w-xs"
  href="/votebank/{item.votebank}/proposal/{item.proposalId}"
>
  <div
    class="flex h-full flex-col justify-between rounded-lg bg-white p-4 dark:bg-gray-900"
  >
    <div class="flex flex-col justify-between md:flex-row">
      <h4
        class="mb-6 w-full text-lg font-medium tracking-tight text-gray-900 dark:text-gray-100 sm:mb-10 md:text-lg"
      >
        {item.data.title}
      </h4>
    </div>
    <div class="capsize flex items-center text-gray-800 dark:text-gray-200">
      {item.data.summary}
    </div>
  </div>
</a>

