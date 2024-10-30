<script lang="ts">
	import { getRemainingTime } from '$lib/utils/date';
	import { onMount, onDestroy } from 'svelte';

	export let targetDate: Date;
	export let displayLabel: boolean;
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

<div class="capsize card-content flex items-center text-secondary-dark dark:text-accent-light">
	<span title="Clock countdown">
		{#if !ended}
			<span class="text-m countdown font-mono">
				{#if displayLabel} Ending in &nbsp;{/if}
				<span style="--value:{days > 99 ? 99 : days};" />:
				<span style="--value:{hours};" />:
				<span style="--value:{minutes};" />:
				<span style="--value:{seconds};" />
			</span>
		{:else}
			<p class="text-sm font-semibold text-secondary dark:text-accent">Ended</p>
		{/if}
	</span>
</div>

<style lang="postcss">
	.countdown-container {
		@apply text-center text-secondary-dark dark:bg-brand-dark;
	}
	.countdown-item {
		@apply flex flex-col items-center;
	}
	.timer-heading {
		@apply mb-2 text-sm leading-none text-secondary-dark dark:text-accent-light;
	}
</style>
