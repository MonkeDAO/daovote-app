<script>
    import { onMount } from "svelte";
    import { createEventDispatcher } from "svelte";
	import Editor from "../Editor.svelte";
  
    const dispatch = createEventDispatcher();
  
    let title = "";
    let description = "";
    let settingsType = "";
    let settingsValue = "";
  
    function submitForm() {
      const settings = {
        [settingsType]: settingsValue,
      };
  
      dispatch("submit", { title, description, settings });
    }
  </script>
  
  <div class="p-4 bg-gray-400 dark:bg-gray-800 rounded-md shadow-lg">
    <form on:submit|preventDefault="{submitForm}" class="space-y-4">
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
        <input type="text" id="title" bind:value="{title}" class="form-input mt-1 block w-full dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 rounded" placeholder=" Title" required />
      </div>
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <textarea id="description" bind:value="{description}" class="form-textarea mt-1 block w-full dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 rounded" rows="3" placeholder=" Description" required></textarea>
      </div>
      <div>
        <label for="settingsType" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Settings Type</label>
        <select id="settingsType" bind:value="{settingsType}" class="form-select mt-1 block w-full dark:bg-gray-700 dark:text-gray-100 rounded" required>
          <option value="">Select a type</option>
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        </select>
      </div>
      {#if settingsType}
        <div>
          <label for="settingsValue" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Settings Value</label>
          <input type="text" id="settingsValue" bind:value="{settingsValue}" class="form-input mt-1 block w-full dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 rounded" placeholder="Settings Value" required />
        </div>
      {/if}
      <button type="submit" class="btn btn-primary">Submit</button>
    </form>
    <div class="mx-auto w-full max-w-5xl">
      <Editor />
    </div>
  </div>
<style>
.editor-content {
    width: 100%; /* Set the default width to 100% of the parent element */
    min-width: 400px; /* Set a minimum width for the editor */
  }
  button {
      border: none;
      padding: 8px;
      border-radius: 5px;
      font-size: 16px;
      cursor: pointer;
      color: white;
      background-color: #4e44ce;
    }
</style>