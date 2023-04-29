<script>
    export let title = '';
    export let expanded = false;
    let contentVisible = expanded;
  </script>
  
  <div class="w-full flex flex-col items-center">
    <button
      class="btn btn-primary w-1/4 justify-center"
      on:click={() => (contentVisible = !contentVisible)}
    >
      {title}
    </button>
    {#if contentVisible}
      <div class="p-4">
        <slot></slot>
      </div>
    {/if}
</div>
  