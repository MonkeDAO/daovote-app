<script lang="ts">
	import { getRemainingTime } from '$lib/utils/date';
	import { onMount, onDestroy } from 'svelte';

	export let targetDate: Date;

	let days = 0;
	let hours = 0;
	let minutes = 0;
	let seconds = 0;
	let ended = false;

	let intervalId: any;

	function updateRemainingTime() {
		const remainingTime = getRemainingTime(targetDate);

		if (remainingTime.ended) {
			ended = true;
			clearInterval(intervalId);
		} else {
			days = remainingTime.days;
			hours = remainingTime.hours;
			minutes = remainingTime.minutes;
			seconds = remainingTime.seconds;
		}
	}

	onMount(() => {
		updateRemainingTime();
		intervalId = setInterval(updateRemainingTime, 1000);
	});

	onDestroy(() => {
		clearInterval(intervalId);
	});
</script>

<div class="countdown-container">
	<div class="timer-heading">Time Remaining</div>
	{#if !ended}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
			<div class="countdown-item">
				<span class="text-2xl font-semibold">{days}</span>
				<span>Days</span>
			</div>
			<div class="countdown-item">
				<span class="text-2xl font-semibold">{hours}</span>
				<span>Hours</span>
			</div>
			<div class="countdown-item">
				<span class="text-2xl font-semibold">{minutes}</span>
				<span>Minutes</span>
			</div>
			<div class="countdown-item">
				<span class="text-2xl font-semibold">{seconds}</span>
				<span>Seconds</span>
			</div>
		</div>
	{:else}
		<p class="text-2xl font-semibold">Ended</p>
	{/if}
</div>

<style lang="postcss">
	.countdown-container {
		@apply rounded-md bg-blue-500 p-4 text-center text-white dark:bg-gray-600;
	}
	.countdown-item {
		@apply flex flex-col items-center;
	}
	.timer-heading {
		@apply mb-2 text-lg font-bold leading-none;
	}
</style>
