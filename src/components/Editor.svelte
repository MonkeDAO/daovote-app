<script lang="ts">
	import { onMount } from 'svelte';
	import type { Readable } from 'svelte/store';
	import { Editor, EditorContent, FloatingMenu, BubbleMenu, createEditor } from 'svelte-tiptap';
	import Fa from 'svelte-fa';
	import {
		faHeading,
		faBold,
		faItalic,
		faParagraph,
		faCode,
		faFileCode,
		faListOl,
		faListUl,
    faQuoteLeft
	} from '@fortawesome/free-solid-svg-icons';
	//using tiptap https://tiptap.dev/api/introduction to create a rich text editor
	import StarterKit from '@tiptap/starter-kit';

	let editor: Readable<Editor>;

	onMount(() => {
		editor = createEditor({
			extensions: [StarterKit],
			content: `
        <p>Proposal info goes here. Format like a normal text editor.</p>
      `
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
	const toggleNumberedList = () => {
		$editor.chain().focus().toggleOrderedList().run();
	};
	const toggleBulletedList = () => {
		$editor.chain().focus().toggleBulletList().run();
	};
  const toggleBlockquote = () => {
		$editor.chain().focus().toggleBlockquote().run();
	};

	$: isActive = (name: string, attrs = {}) => $editor.isActive(name, attrs);
</script>

<div class="editor-container bg-white dark:bg-gray-800">
	{#if editor}
		<div class="menu flex space-x-2 bg-gray-200 p-2 dark:bg-gray-700">
			<button on:click="{toggleHeading(1)}" class="btn btn-sm btn-outline mr-2 flex items-center" class:active={isActive('heading', { level: 1 })}>
        <Fa icon="{faHeading}" class="text-sm mr-1" />
        <span class="align-middle">1</span>
      </button>
			<button on:click="{toggleHeading(2)}" class="btn btn-sm btn-outline mr-2 flex items-center" class:active={isActive('heading', { level: 2 })}>
        <Fa icon="{faHeading}" class="text-sm mr-1" />
        <span class="align-middle">2</span>
      </button>
      <button on:click="{toggleHeading(3)}" class="btn btn-sm btn-outline mr-2 flex items-center" class:active={isActive('heading', { level: 3 })}>
        <Fa icon="{faHeading}" class="text-sm mr-1" />
        <span class="align-middle">3</span>
      </button>
			<button
				on:click={toggleBold}
				class:active={isActive('bold')}
				class="btn btn-sm btn-square btn-outline btn-primary"><Fa icon={faBold} /></button
			>
			<button
				on:click={toggleItalic}
				class:active={isActive('italic')}
				class="btn btn-sm btn-square btn-outline btn-primary"><Fa icon={faItalic} /></button
			>
			<button
				on:click={setParagraph}
				class:active={isActive('paragraph')}
				class="btn btn-sm btn-square btn-outline btn-primary"><Fa icon={faParagraph} /></button
			>
			<button
				on:click={toggleCode}
				class:active={isActive('code')}
				class="btn btn-sm btn-square btn-outline btn-primary"><Fa icon={faCode} /></button
			>
			<button
				on:click={toggleCodeBlock}
				class:active={isActive('codeblock')}
				class="btn btn-sm btn-square btn-outline btn-primary"><Fa icon={faFileCode} /></button
			>
			<button
				on:click={toggleNumberedList}
				class:active={isActive('orderedList')}
				class="btn btn-sm btn-square btn-outline btn-primary"><Fa icon={faListOl} /></button
			>
			<button
				on:click={toggleBulletedList}
				class:active={isActive('bulletList')}
				class="btn btn-sm btn-square btn-outline btn-primary"><Fa icon={faListUl} /></button
			>
      <button
				on:click={toggleBlockquote}
				class:active={isActive('blockquote')}
				class="btn btn-sm btn-square btn-outline btn-primary"><Fa icon={faQuoteLeft} /></button
			>
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
</div>
<button on:click={() => console.log($editor.getHTML())}>Get HTML</button>

<style>
	.editor-container {
		border: 1px solid #e5e7eb; /* Light gray border */
		border-radius: 4px;
		width: 100%;
		overflow: hidden; /* Hide any overflow */
    margin-top: 16px;
    margin-bottom: 16px;
	}
	:global(.ProseMirror:focus) {
		outline: none;
	}
	:global(.ProseMirror) {
    padding: 0.5rem;
		min-height: 300px;
	}

	@media screen and (min-width: 768px) {
		:global(.ProseMirror) {
			min-width: 600px;
		}
	}

	@media screen and (max-width: 767px) {
		:global(.ProseMirror) {
			min-width: 100%;
		}
	}
	.menu {
		margin-bottom: 1rem;
		border-radius: 4px;
	}

	.btn-square {
		width: 32px;
		height: 32px;
	}
  .menu button {
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu span.align-middle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
