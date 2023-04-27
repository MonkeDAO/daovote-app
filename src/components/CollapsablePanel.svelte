<script>
    export let title = '';
    export let expanded = false;
    let contentVisible = expanded;
  </script>
  
  <div class="w-full">
    <button
      class="btn btn-primary w-full"
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
  