# 06 - Components Migration

## Overview

This document covers converting Svelte components to React components, organized by complexity and priority.

---

## Component Inventory

### High Priority (Core Functionality)

| Component    | Svelte Path                    | Complexity | Notes                     |
| ------------ | ------------------------------ | ---------- | ------------------------- |
| ProposalView | `Proposal/ProposalView.svelte` | **High**   | Chart.js, modals, voting  |
| ProposalForm | `Proposal/ProposalForm.svelte` | **High**   | Date picker, file upload  |
| NFTGrid      | `NFTGrid.svelte`               | **Medium** | Selection state           |
| Nav          | `Nav.svelte`                   | **Medium** | Wallet button, responsive |
| Editor       | `Editor.svelte`                | **High**   | TipTap integration        |

### Medium Priority (UI Components)

| Component             | Svelte Path                                | Complexity |
| --------------------- | ------------------------------------------ | ---------- |
| VoteBankCard          | `Vote/VoteBanks/VoteBankCard.svelte`       | Low        |
| ProposalProgress      | `Proposal/ProposalProgress.svelte`         | Low        |
| CountDownCard         | `CountDownCard.svelte`                     | Medium     |
| GeneralCard           | `GeneralCard.svelte`                       | Low        |
| ConfirmationModal     | `ConfirmationModal.svelte`                 | Medium     |
| VoteConfirmationModal | `Vote/Voting/VoteConfirmationModal.svelte` | Medium     |
| LoadingOverlay        | `LoadingOverlay.svelte`                    | Low        |
| MobileMenu            | `MobileMenu.svelte`                        | Medium     |

### Low Priority (Simple Components)

| Component   | Svelte Path          | Complexity |
| ----------- | -------------------- | ---------- |
| NavLink     | `NavLink.svelte`     | Low        |
| FeatureCard | `FeatureCard.svelte` | Low        |
| IndexCard   | `IndexCard.svelte`   | Low        |
| PDFViewer   | `PDFViewer.svelte`   | Low        |
| Skeletons   | `skeletons/*`        | Low        |

---

## Conversion Patterns

### Pattern 1: Props

**Svelte:**

```svelte
<script>
	export let title: string;
	export let count = 0; // with default
	export let onClick: () => void;
</script>
```

**React:**

```tsx
interface Props {
  title: string;
  count?: number;
  onClick: () => void;
}

function MyComponent({ title, count = 0, onClick }: Props) {
  return (/* ... */);
}
```

### Pattern 2: Events → Callbacks

**Svelte:**

```svelte
<script>
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	function handleClick() {
		dispatch('vote', { optionId: 1 });
	}
</script>

<!-- Parent -->
<Child on:vote={handleVote} />
```

**React:**

```tsx
interface Props {
	onVote: (optionId: number) => void;
}

function Child({ onVote }: Props) {
	function handleClick() {
		onVote(1);
	}
}

// Parent
<Child onVote={(id) => handleVote(id)} />;
```

### Pattern 3: Slots → Children

**Svelte:**

```svelte
<div class="card">
	<slot name="header" />
	<slot />
	<!-- default slot -->
	<slot name="footer" />
</div>
```

**React:**

```tsx
interface Props {
	header?: React.ReactNode;
	children: React.ReactNode;
	footer?: React.ReactNode;
}

function Card({ header, children, footer }: Props) {
	return (
		<div className="card">
			{header}
			{children}
			{footer}
		</div>
	);
}
```

### Pattern 4: bind:this → useRef + useImperativeHandle

**Svelte:**

```svelte
<!-- Modal.svelte -->
<script>
	let isOpen = false;
	export function openModal() {
		isOpen = true;
	}
	export function closeModal() {
		isOpen = false;
	}
</script>

<!-- Parent -->
<Modal bind:this={modal} />
<button on:click={() => modal.openModal()}>Open</button>
```

**React:**

```tsx
// Modal.tsx
import { forwardRef, useImperativeHandle, useState } from 'react';

export interface ModalHandle {
  openModal: () => void;
  closeModal: () => void;
}

const Modal = forwardRef<ModalHandle, Props>((props, ref) => {
  const [isOpen, setIsOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    openModal: () => setIsOpen(true),
    closeModal: () => setIsOpen(false),
  }));

  if (!isOpen) return null;
  return (/* modal content */);
});

// Parent
const modalRef = useRef<ModalHandle>(null);
<Modal ref={modalRef} />
<button onClick={() => modalRef.current?.openModal()}>Open</button>
```

### Pattern 5: Reactive Statements

**Svelte:**

```svelte
<script>
	export let items;
	$: filteredItems = items.filter((i) => i.active);
	$: totalCount = filteredItems.length;

	// Side effect
	$: if (items.length > 0) {
		console.log('Items loaded');
	}
</script>
```

**React:**

```tsx
function MyComponent({ items }: Props) {
	// Computed values - just calculate inline or useMemo
	const filteredItems = items.filter((i) => i.active);
	const totalCount = filteredItems.length;

	// Side effect - use useEffect
	useEffect(() => {
		if (items.length > 0) {
			console.log('Items loaded');
		}
	}, [items.length]);
}
```

---

## Component Examples

### 1. LoadingOverlay (Simple)

**Svelte:**

```svelte
<script>
	import { loading, message } from '$lib/stores';
</script>

{#if $loading}
	<div class="overlay">
		<div class="spinner" />
		{#if $message}
			<p>{$message}</p>
		{/if}
	</div>
{/if}
```

**React:**

```tsx
'use client';

import { useUIStore } from '@/lib/stores/ui-store';

export function LoadingOverlay() {
	const { loading, message } = useUIStore();

	if (!loading) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="rounded-lg bg-white p-6 text-center">
				<div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				{message && <p className="mt-4">{message}</p>}
			</div>
		</div>
	);
}
```

---

### 2. ProposalProgress (Medium)

**React:** `src/components/proposal/proposal-progress.tsx`

```tsx
'use client';

import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';

interface Props {
	quorumThreshold: number;
	voterCount: number;
	quorumMetTime?: Date | null;
	compact?: boolean;
}

export function ProposalProgress({
	quorumThreshold,
	voterCount,
	quorumMetTime,
	compact = false
}: Props) {
	const progress = useMemo(() => {
		if (quorumThreshold === 0) return 100;
		return Math.min((voterCount / quorumThreshold) * 100, 100);
	}, [voterCount, quorumThreshold]);

	const isQuorumMet = quorumMetTime !== null;

	if (compact) {
		return (
			<div className="flex items-center gap-2">
				<Progress value={progress} className="h-2 flex-1" />
				<span className="text-sm">
					{voterCount}/{quorumThreshold}
				</span>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<div className="flex justify-between text-sm">
				<span>Quorum Progress</span>
				<span className={isQuorumMet ? 'text-green-500' : ''}>
					{voterCount} / {quorumThreshold}
					{isQuorumMet && ' (Met!)'}
				</span>
			</div>
			<Progress value={progress} className="h-3" />
		</div>
	);
}
```

---

### 3. CountdownCard (Medium - with interval)

**React:** `src/components/countdown-card.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { getRemainingTime } from '@/lib/utils/date';

interface Props {
	targetDate: Date;
	displayLabel?: boolean;
}

interface TimeLeft {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
}

export function CountdownCard({ targetDate, displayLabel = true }: Props) {
	const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getRemainingTime(targetDate));

	useEffect(() => {
		const timer = setInterval(() => {
			setTimeLeft(getRemainingTime(targetDate));
		}, 1000);

		return () => clearInterval(timer);
	}, [targetDate]);

	const isExpired =
		timeLeft.days <= 0 && timeLeft.hours <= 0 && timeLeft.minutes <= 0 && timeLeft.seconds <= 0;

	if (isExpired) {
		return <div className="text-red-500">Ended</div>;
	}

	return (
		<div className="flex gap-2">
			{displayLabel && <span>Ends in:</span>}
			<div className="flex gap-1 font-mono">
				<span>{timeLeft.days}d</span>
				<span>{timeLeft.hours}h</span>
				<span>{timeLeft.minutes}m</span>
				<span>{timeLeft.seconds}s</span>
			</div>
		</div>
	);
}
```

---

### 4. NFTGrid (Medium - with selection)

**React:** `src/components/nft/nft-grid.tsx`

```tsx
'use client';

import { useSelectedNftsStore } from '@/lib/stores/selected-nfts-store';
import { NFTCard } from './nft-card';
import type { NftMetadata } from '@/types';

interface Props {
	nfts: NftMetadata[];
	selectable?: boolean;
	maxSelections?: number;
}

export function NFTGrid({ nfts, selectable = false, maxSelections }: Props) {
	const { selectedNfts, toggleNft, isSelected } = useSelectedNftsStore();

	const canSelectMore = !maxSelections || selectedNfts.length < maxSelections;

	return (
		<div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
			{nfts.map((nft) => {
				const selected = isSelected(nft);
				const disabled = selectable && !selected && !canSelectMore;

				return (
					<NFTCard
						key={nft.address}
						nft={nft}
						selected={selected}
						disabled={disabled}
						onClick={selectable ? () => toggleNft(nft) : undefined}
					/>
				);
			})}
		</div>
	);
}

// NFTCard.tsx
interface NFTCardProps {
	nft: NftMetadata;
	selected?: boolean;
	disabled?: boolean;
	onClick?: () => void;
}

export function NFTCard({ nft, selected, disabled, onClick }: NFTCardProps) {
	return (
		<div
			className={`
        relative cursor-pointer overflow-hidden rounded-lg transition
        ${selected ? 'ring-2 ring-primary' : ''}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:shadow-lg'}
      `}
			onClick={disabled ? undefined : onClick}
		>
			<img
				src={nft.json?.image || '/placeholder.png'}
				alt={nft.json?.name || 'NFT'}
				className="aspect-square w-full object-cover"
			/>
			{selected && (
				<div className="absolute right-2 top-2 rounded-full bg-primary p-1 text-white">
					<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
					</svg>
				</div>
			)}
			<div className="p-2">
				<p className="truncate text-sm">{nft.json?.name || 'Unknown'}</p>
			</div>
		</div>
	);
}
```

---

### 5. ConfirmationModal (with shadcn Dialog)

**React:** `src/components/confirmation-modal.tsx`

```tsx
'use client';

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title?: string;
	message: string;
	onConfirm: () => void;
	onCancel?: () => void;
	confirmText?: string;
	cancelText?: string;
	variant?: 'default' | 'destructive';
}

export function ConfirmationModal({
	open,
	onOpenChange,
	title = 'Confirm',
	message,
	onConfirm,
	onCancel,
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	variant = 'default'
}: Props) {
	const handleConfirm = () => {
		onConfirm();
		onOpenChange(false);
	};

	const handleCancel = () => {
		onCancel?.();
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{message}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={handleCancel}>
						{cancelText}
					</Button>
					<Button variant={variant} onClick={handleConfirm}>
						{confirmText}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
```

---

### 6. Navigation Component

**React:** `src/components/nav/nav.tsx`

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useIsOwner } from '@/lib/hooks/use-owner-check';
import { useThemeStore } from '@/lib/stores/theme-store';
import { WalletButton } from '@/components/wallet/wallet-button';
import { MobileMenu } from './mobile-menu';
import { Sun, Moon } from 'lucide-react';

const VOTEBANK = process.env.NEXT_PUBLIC_VOTEBANK;

export function Nav() {
	const pathname = usePathname();
	const { connected } = useWallet();
	const { data: isOwner } = useIsOwner(VOTEBANK);
	const { isDark, toggleTheme } = useThemeStore();

	const navLinks = [
		{ href: '/', label: 'Home' },
		{ href: '/votebanks', label: 'Vote Banks' },
		{ href: '/delegate/create', label: 'Delegate' },
		...(isOwner ? [{ href: `/votebank/${VOTEBANK}/create`, label: 'Create Proposal' }] : [])
	];

	return (
		<nav className="sticky top-0 z-40 border-b bg-base-100">
			<div className="container mx-auto px-4">
				<div className="flex h-16 items-center justify-between">
					{/* Logo */}
					<Link href="/" className="text-xl font-bold">
						DAOVote
					</Link>

					{/* Desktop Nav */}
					<div className="hidden items-center gap-6 md:flex">
						{navLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className={`transition hover:text-primary ${
									pathname === link.href ? 'font-medium text-primary' : ''
								}`}
							>
								{link.label}
							</Link>
						))}
					</div>

					{/* Right side */}
					<div className="flex items-center gap-4">
						<button onClick={toggleTheme} className="rounded-lg p-2 hover:bg-base-200">
							{isDark ? <Sun size={20} /> : <Moon size={20} />}
						</button>

						<div className="hidden md:block">
							<WalletButton />
						</div>

						<MobileMenu links={navLinks} />
					</div>
				</div>
			</div>
		</nav>
	);
}
```

---

## shadcn/ui Component Mapping

| DaisyUI (Current) | shadcn/ui (New) |
| ----------------- | --------------- |
| `btn`             | `Button`        |
| `card`            | `Card`          |
| `modal`           | `Dialog`        |
| `dropdown`        | `DropdownMenu`  |
| `tabs`            | `Tabs`          |
| `input`           | `Input`         |
| `badge`           | `Badge`         |
| `progress`        | `Progress`      |
| `alert`           | `Alert`         |
| `table`           | `Table`         |
| `skeleton`        | `Skeleton`      |

You can use **both** DaisyUI (for theming) and shadcn/ui (for components).

---

## Checklist

- [ ] Create component directory structure
- [ ] Convert LoadingOverlay
- [ ] Convert Nav and MobileMenu
- [ ] Convert ProposalProgress
- [ ] Convert CountdownCard
- [ ] Convert NFTGrid and NFTCard
- [ ] Convert ConfirmationModal
- [ ] Convert VoteConfirmationModal
- [ ] Convert ProposalView (complex)
- [ ] Convert ProposalForm (complex)
- [ ] Convert Editor (TipTap)
- [ ] Convert VoteBankCard
- [ ] Convert all skeleton components
- [ ] Set up shadcn/ui components

---

## Next Steps

→ [07-ANCHOR-SOLANA.md](./07-ANCHOR-SOLANA.md) - Anchor/Solana code migration details
