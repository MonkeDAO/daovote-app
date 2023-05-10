<script>
	// https://rodneylab.com/using-local-storage-sveltekit/
	import { browser } from '$app/environment';
	import { writable } from 'svelte/store';

	// const defaultValue = true;
	// const initialValue = browser
	// 	? window.localStorage.getItem('isNewsletterOpen') ?? defaultValue
	// 	: defaultValue;

	// const isNewsletterOpen = writable(!!initialValue);

	// isNewsletterOpen.subscribe((value) => {
	// 	if (browser) {
	// 		window.localStorage.setItem('isNewsletterOpen', value ? 'true' : 'false');
	// 	}
	// });

	// function toggleNewsletter() {
	// 	$isNewsletterOpen = !$isNewsletterOpen;
	// }

	let isDark = false;
	if (typeof localStorage !== 'undefined') {
		if (
			localStorage.theme === 'dark' ||
			(!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
		) {
			isDark = true;
		}
	}
	function toggleDarkMode() {
		if (isDark) {
			document.documentElement.classList.remove('dark');
			localStorage.theme = 'light';
			isDark = false;
		} else {
			document.documentElement.classList.add('dark');
			localStorage.theme = 'dark';
			isDark = true;
		}
	}
</script>

<section class="mb-16 w-full" id="newsletter">
	{#if isDark}
		<iframe
			width="540"
			height="400"
			src="https://591a293c.sibforms.com/serve/MUIEADg36V-Zo5LrSmvVvqv6Cq4KLr0XSHfm8y74Lyvrohv4savZIAqYfkYjvilzMxN3k-9pQVuFsYAKdho1aXUJkwygdBsKGJ7UMDJQgup2hUG8VECQa428Z9QE8JQEXspyAKGsXLH8WJi6w-ZuVEZJCyZiqp2Drv5NrQ_oHmVIQvQzOiDFmBmUHoQSWrFput7v0B3niZw7U3Kq"
			frameborder="0"
			scrolling="auto"
			allowfullscreen
			style="display: block;margin-left: auto;margin-right: auto;max-width: 100%;"
		/>
	{:else}
		<iframe
			width="540"
			height="400"
			src="https://591a293c.sibforms.com/serve/MUIEAD_yOhacsxb_hNopr46EE9eVHD3dmdlGWvf_8Q-rqkUhK3CoqEyq4Q79q8rzBZHIwD9jVYMHOeOYqtmapwjhv9GEbQS3aojRCE4yA8TZZVi8L0fiDVlbrVN5AdVt2aFx-IxhNBAerpIwO_nTLGBrcrwjW6foqD-7LuB7CdK2gefCwK59Q3twmN7pzs-JNCWFdvKFem9WvG4e"
			frameborder="0"
			scrolling="auto"
			allowfullscreen
			style="display: block;margin-left: auto;margin-right: auto;max-width: 100%;"
		/>
	{/if}
</section>
