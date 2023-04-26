<script lang="ts">
	import { onDestroy, onMount, createEventDispatcher } from 'svelte';
	import type { Readable } from 'svelte/store';
	import { Editor, EditorContent, FloatingMenu, BubbleMenu, createEditor } from 'svelte-tiptap';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
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
		faQuoteLeft,
		faSave,
		faUpload,
	} from '@fortawesome/free-solid-svg-icons';
	//using tiptap https://tiptap.dev/api/introduction to create a rich text editor
	import StarterKit from '@tiptap/starter-kit';
	import { toast } from '@zerodevx/svelte-toast'

	const dispatch = createEventDispatcher();
	let editor: Readable<Editor>;
	let saveEnabled = false;
	let wallet: any;

	$: if ($walletStore?.wallet?.publicKey) {
		wallet = $walletStore.wallet;
	}
	const handleSaveToggle = () => {
		saveEnabled = !saveEnabled;
		localStorage.setItem('editorContent', $editor.getHTML());
	};

	function handleClick() {
		const htmlString = $editor.getHTML();
		// Create a Blob object from the HTML string
		const blob = new Blob([htmlString], { type: 'text/html' });
		const file = new File([blob], `daovote_proposal_${wallet?.publicKey ?? Date.now()}`, { type: 'text/html' });
		console.log('file', file);
		toast.push('File ready to upload!')
		dispatch('file-generated', file);
	}
	onMount(() => {
		editor = createEditor({
			extensions: [StarterKit],
			content:
				localStorage.getItem('editorContent') ||
				`
        <p>Proposal info goes here. Format like a normal text editor.</p>
      `
		});
		const unsubscribe = $editor.on('update', () => {
			if (saveEnabled) {
				saveContent();
			}
		});
	});

	function saveContent() {
		localStorage.setItem('editorContent', $editor.getHTML());
	}
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
		<div class="flex flex-wrap gap-1 space-x-2 bg-gray-200 p-2 dark:bg-gray-700">
			<button
				title="Heading 1"
				on:click={toggleHeading(1)}
				class="btn-square btn-sm btn-outline mr-2 flex items-center"
				class:active={isActive('heading', { level: 1 })}
			>
				<Fa icon={faHeading} class="mr-1 text-sm" />
				<span class="align-middle">1</span>
			</button>
			<button
				title="Heading 2"
				on:click={toggleHeading(2)}
				class="btn-square btn-sm btn-outline mr-2 flex items-center"
				class:active={isActive('heading', { level: 2 })}
			>
				<Fa icon={faHeading} class="mr-1 text-sm" />
				<span class="align-middle">2</span>
			</button>
			<button
				title="Heading 3"
				on:click={toggleHeading(3)}
				class="btn-square btn-sm btn-outline mr-2 flex items-center"
				class:active={isActive('heading', { level: 3 })}
			>
				<Fa icon={faHeading} class="mr-1 text-sm" />
				<span class="align-middle">3</span>
			</button>
			<button
				title="Bold"
				on:click={toggleBold}
				class:active={isActive('bold')}
				class="btn-square btn-sm btn-outline mr-2 flex items-center"><Fa icon={faBold} /></button
			>
			<button
				title="Italic"
				on:click={toggleItalic}
				class:active={isActive('italic')}
				class="btn-square btn-sm btn-outline mr-2 flex items-center"><Fa icon={faItalic} /></button
			>
			<button
				title="Paragraph"
				on:click={setParagraph}
				class:active={isActive('paragraph')}
				class="btn-square btn-sm btn-outline mr-2 flex items-center"><Fa icon={faParagraph} /></button
			>
			<button
				title="Code"
				on:click={toggleCode}
				class:active={isActive('code')}
				class="btn-square btn-sm btn-outline mr-2 flex items-center"><Fa icon={faCode} /></button
			>
			<button
				title="Code block"
				on:click={toggleCodeBlock}
				class:active={isActive('codeblock')}
				class="btn-square btn-sm mr-2 flex items-center"><Fa icon={faFileCode} /></button
			>
			<button
				title="Numbered list"
				on:click={toggleNumberedList}
				class:active={isActive('orderedList')}
				class="btn-square btn-sm mr-2 flex items-center"><Fa icon={faListOl} /></button
			>
			<button
				title="Bulleted list"
				on:click={toggleBulletedList}
				class:active={isActive('bulletList')}
				class="btn-square btn-sm mr-2 flex items-center"><Fa icon={faListUl} /></button
			>
			<button
				title="Blockquote"
				on:click={toggleBlockquote}
				class:active={isActive('blockquote')}
				class="btn-square btn-sm mr-2 flex items-center"><Fa icon={faQuoteLeft} /></button
			>
			<button
				title="Convert to file for upload"
				on:click={handleClick}
				class:active={isActive('upload')}
				class="btn-square btn-sm mr-2 flex items-center"><Fa icon={faUpload} /></button
			>
			<button
				title="Auto-save"
				on:click={handleSaveToggle}
				class="btn-square btn-sm mr-2 flex items-center {saveEnabled
					? 'bg-green-500 text-white'
					: ''}"
			>
				<Fa icon={faSave} />
			</button>
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

<style>
	.editor-container {
  border: 1px solid #e5e7eb; /* Light gray border */
  border-radius: 4px;
  width: 100%;
  max-width: 800px;
  margin: 16px auto;
  overflow: hidden; /* Hide any overflow */
}

:global(.ProseMirror:focus) {
  outline: none;
}

:global(.ProseMirror) {
  padding: 0.5rem;
  min-height: 300px;
  width: 100%;
}

button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px 4px;
  border-radius: 4px;
  margin: 0;
  border: 1px solid black;
}

button.active {
  background: black;
  color: white;
}
</style>
