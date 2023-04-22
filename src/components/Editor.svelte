<script lang="ts">
  import { onMount } from 'svelte';
  import type { Readable } from 'svelte/store';
  import { Editor, EditorContent, FloatingMenu, BubbleMenu, createEditor } from 'svelte-tiptap';
  //using tiptap https://tiptap.dev/api/introduction to create a rich text editor
  import StarterKit from '@tiptap/starter-kit';

  let editor: Readable<Editor>;

  onMount(() => {
    editor = createEditor({
      extensions: [StarterKit],
      content: `
        <p>Proposal info goes here. Format like a normal text editor.</p>
      `,
    });
  });

  
  

  const toggleHeading = (level: any) => {
    return () => {
      $editor.chain().focus().toggleHeading({ level }).run();
    };
  };

  const toggleBold = () => {
    $editor.chain().focus().toggleBold().run();
  };

  const toggleItalic = () => {
    $editor.chain().focus().toggleItalic().run();
  };

  const setParagraph = () => {
    $editor.chain().focus().setParagraph().run();
  };

  const toggleCode = () => {
    $editor.chain().focus().toggleCode().run();
  };

  const toggleCodeBlock = () => {
    $editor.chain().focus().toggleCodeBlock().run();
  };

  $: isActive = (name: string, attrs = {}) => $editor.isActive(name, attrs);
</script>

{#if editor}
  <div class="menu">
    <button on:click={toggleHeading(1)} class:active={isActive('heading', { level: 1 })}> H1 </button>
    <button on:click={toggleHeading(2)} class:active={isActive('heading', { level: 2 })}> H2 </button>
    <button on:click={toggleBold} class:active={isActive('bold')}> B </button>
    <button on:click={toggleItalic} class:active={isActive('italic')}> I </button>
    <button on:click={setParagraph} class:active={isActive('paragraph')}> P </button>
    <button on:click={toggleCode} class:active={isActive('code')}> Code </button>
    <button on:click={toggleCodeBlock} class:active={isActive('codeblock')}> Codeblock </button>
  </div>
{/if}

{#if editor}
  <FloatingMenu editor={$editor}>
    <button on:click={toggleBold} class:active={isActive('bold')}> B </button>
    <button on:click={toggleItalic} class:active={isActive('italic')}> I </button>
  </FloatingMenu>
{/if}

{#if editor}
  <BubbleMenu editor={$editor}>
    <button on:click={toggleBold} class:active={isActive('bold')}> B </button>
    <button on:click={toggleItalic} class:active={isActive('italic')}> I </button>
  </BubbleMenu>
{/if}

<EditorContent editor={$editor} />
<button on:click={() => console.log($editor.getHTML())}>Get HTML</button>

<style>
  .menu {
    margin: 1rem 0;
  }

  button {
    padding: 2px 6px;
    border-radius: 4px;
		margin: 0;
    border: 1px solid black;
  }

  button.active {
    background: black;
    color: white;
  }
</style>
