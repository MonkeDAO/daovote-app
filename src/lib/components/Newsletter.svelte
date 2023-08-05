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
			width="440"
			height="400"
			src="https://591a293c.sibforms.com/serve/MUIEAEJ46IWXL1_Wt-qAeV8rlsBdpanz6eGFISm02syfsM1OcFUoh94AtUz5wfHyBdrqCrVaoeFY250X5eqe-zao1wQhgJnA_cuIFCfYr2eH5QqcVrLAMZrvH46-J7zhG5O30aVhOeH2SOsYa23tFKOO11i6U4JXnfh8YjNnRRSe0NCy_0p8oKhwBS7lgLwXAF_mVlD-zmjvYklz"
			frameborder="0"
			scrolling="auto"
			allowfullscreen
			style="display: block;margin-left: auto;margin-right: auto;max-width: 100%;"
		/>
	{:else}
		<iframe
			width="440"
			height="400"
			src="https://591a293c.sibforms.com/serve/MUIEACnWpFzmRrkTMW3zO_cQeTvhmNHSYoDktQZhU29Gi86PV_TMDjItCdNmz2AkWL-phxPezfj57hZJ3Ojpffpa10tDeWqhIaUi1xqt77Z9Z0HqvfqjZAv-Aeixfo_WEUfxviOyGfCQYjTe0ioGDtC8pdPN1bDyDN5HNPXrgQijUFVJAf2Fwgbl43qdFPSoVE3IRgupq4M1dgQy"
			frameborder="0"
			scrolling="auto"
			allowfullscreen
			style="display: block;margin-left: auto;margin-right: auto;max-width: 100%;"
		/>
	{/if}
</section>
