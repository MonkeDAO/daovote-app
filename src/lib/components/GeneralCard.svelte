<script lang="ts">
	import type { CardItem } from "$lib/types";

	export let item: CardItem;
</script>

<a
  class="transform rounded-xl bg-gradient-to-r from-purple-400 via-blue-500 to-green-200 p-1 transition-all hover:scale-[1.01] w-full md:w-auto md:max-w-xs card-wrapper"
  href="{item.url}"
>
  <div
    class="flex h-full flex-col justify-between rounded-lg bg-white p-4 dark:bg-gray-900"
  >
    <div class="flex flex-col justify-between md:flex-row card-content">
      <h4
        class="mb-6 w-full text-lg font-medium tracking-tight text-gray-900 dark:text-gray-100 sm:mb-10 md:text-lg card-content"
      >
        {item.title}
      </h4>
    </div>
    <div class="capsize flex items-center text-gray-800 dark:text-gray-200 card-content">
      {item.description}
    </div>
  </div>
</a>

<style>
  .card-wrapper {
    width: 100%; /* Adjust this value to your preference */
    max-width: 300px; /* Adjust this value to your preference */
  }
  .card-content {
    min-height: 50px; /* Adjust this value to your preference */
    max-height: 100px; /* Adjust this value to your preference */
    overflow-y: auto;
  }
</style>