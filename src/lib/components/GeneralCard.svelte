<script lang="ts">
	import type { CardItem } from '$lib/types';
	import CountDownCard from './CountDownCard.svelte';
	import { bnToDate } from '$lib/utils/solana';
	import { onMount } from 'svelte';
	export let item: CardItem;
</script>

<a
	class="card-wrapper w-full transform rounded-xl bg-gradient-to-r from-purple-400 via-blue-500 to-green-200 p-1 transition-all hover:scale-[1.01] md:w-auto md:max-w-xs"
	href={item.url}
>
	<div class="flex h-full flex-col justify-between rounded-lg bg-white p-4 dark:bg-gray-900">
		<div class="card-content flex flex-col justify-between md:flex-row">
			<h4
				class="card-content mb-6 w-full text-lg font-medium tracking-tight text-gray-900 dark:text-gray-100 sm:mb-10 md:text-lg"
			>
				{item.title}
			</h4>
		</div>
		<div class="capsize card-content flex items-center text-gray-800 dark:text-gray-200">
			{item.description}
		</div>
		<CountDownCard targetDate={bnToDate(item.endtime)} displayLabel={false} />
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
	.bar {
		background-color: blue;
		height: 20px;
		margin-bottom: 10px;
	}

	.bar span {
		background-color: red;
		display: block;
		height: 100%;
	}
</style>
