<script lang="ts">
	import { onMount } from 'svelte';
	// import  * as pdfjs from 'pdfjs-dist';
	import PdfViewer from 'svelte-pdf';
	export let pdfUrl = '';

	let canvas: any;
	let pdfInstance: any;
	let currentPage = 1;
	let viewportWidth = 0;
	let viewportScale = 1;
	// pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.js', import.meta.url).toString();
	// async function loadPage(pageNumber: number) {
	//   const page = await pdfInstance.getPage(pageNumber);
	//   const viewport = page.getViewport({ scale: viewportScale });
	//   canvas.width = viewport.width;
	//   canvas.height = viewport.height;
	//   const canvasContext = canvas.getContext('2d');
	//   page.render({ canvasContext, viewport });
	// }

	// function nextPage() {
	//   if (currentPage < pdfInstance.numPages) {
	//     currentPage++;
	//     loadPage(currentPage);
	//   }
	// }

	// function prevPage() {
	//   if (currentPage > 1) {
	//     currentPage--;
	//     loadPage(currentPage);
	//   }
	// }

	onMount(async () => {
		//pdfInstance = await pdfjs.getDocument(pdfUrl).promise;
		// window.addEventListener('resize', handleResize);
		// handleResize();
	});

	// function handleResize() {
	//   viewportWidth = window.innerWidth;
	//   viewportScale = viewportWidth / canvas.width;
	//   loadPage(currentPage);
	// }

	// onDestroy(() => {
	//   window.removeEventListener('resize', handleResize);
	// });
</script>

<div class="relative">
	<PdfViewer data={null} url={pdfUrl} />
	<!-- <canvas bind:this={canvas} class="w-full"></canvas> -->
	<!-- <div class="absolute left-0 bottom-0 p-2">
      <button
        class="btn btn-outline btn-circle"
        on:click={prevPage}
        disabled={currentPage === 1}
      >
        &lt;
      </button>
      <span class="mx-2">{currentPage} / {pdfInstance?.numPages || 0}</span>
      <button
        class="btn btn-outline btn-circle"
        on:click={nextPage}
        disabled={currentPage === pdfInstance?.numPages}
      >
        &gt;
      </button>
    </div> -->
</div>
