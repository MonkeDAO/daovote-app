<script lang="ts">
	import { onMount } from 'svelte';
	import PdfViewer from 'svelte-pdf';
	export let pdfUrl = '';

	onMount(async () => {
		
	});
</script>

<div class="relative">
	<PdfViewer data={null} url={pdfUrl} />
</div>
