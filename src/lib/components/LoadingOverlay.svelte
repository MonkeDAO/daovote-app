<script>
	import { loading } from '$lib/stores/loadingStore'; // import your stores
	import { message } from '$lib/stores/messageStore'; // import your stores
	console.log('loading', $loading, $message);

	// create a function that sets loading to false
	function closeLoadingScreen() {
		message.set(''); // clear the message
		loading.set(false);
	}
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
	class:hidden={!$loading}
>
	<div class="relative flex flex-col items-center rounded bg-white p-5 shadow-md dark:bg-gray-900">
		<!-- Add a close button -->
		<button
			class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 hover:opacity-100"
			on:click={closeLoadingScreen}
		>
			x
		</button>
		<div
			class="mb-4 flex h-14 w-14 animate-spin items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500"
		>
			<div class="h-9 w-9 rounded-full bg-white dark:bg-gray-900" />
		</div>
		<p class="text-gray-900 dark:text-gray-100">{$message}</p>
		<!-- The current message -->
	</div>
</div>
