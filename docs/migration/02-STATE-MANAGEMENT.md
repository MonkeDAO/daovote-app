# 02 - State Management

## Overview

This document covers converting Svelte stores to React state management using **Zustand** for global state and **React Query** for server/async state.

---

## Philosophy: Zustand + React Query

### Why This Combination?

| Use Case                                       | SvelteKit                    | Next.js                              |
| ---------------------------------------------- | ---------------------------- | ------------------------------------ |
| Simple global state (loading, messages, theme) | `writable()`                 | **Zustand**                          |
| Data fetching with caching                     | Custom stores + `derived()`  | **React Query**                      |
| Wallet state                                   | `@svelte-on-solana/*` stores | `@solana/wallet-adapter-react` hooks |
| Computed values                                | `$:` reactive statements     | Inline computation or `useMemo`      |

### Key Insight

Most of your Svelte stores are actually **data fetching stores** (NFTs, delegate accounts, balances). These map perfectly to React Query, which gives you:

- Automatic caching
- Background refetching
- Loading/error states built-in
- No manual "sync" logic needed

---

## Store Mapping

| Svelte Store           | Location                  | Type                    | React Equivalent      |
| ---------------------- | ------------------------- | ----------------------- | --------------------- |
| `walletStore`          | External                  | Wallet state            | `useWallet()` hook    |
| `workSpace`            | External                  | Anchor workspace        | Custom hook           |
| `nftStore`             | `nftStore.ts`             | Data fetching           | **React Query**       |
| `filteredNftStore`     | `filteredNftStore.ts`     | Data fetching           | **React Query**       |
| `delegateAccountStore` | `delegateAccountStore.ts` | Data fetching           | **React Query**       |
| `ownerCheckStore`      | `ownerStore.ts`           | Data fetching + derived | **React Query**       |
| `balanceStore`         | `balance.ts`              | Data fetching           | **React Query**       |
| `shdwBalanceStore`     | `shdwbalance.ts`          | Data fetching           | **React Query**       |
| `selectedNfts`         | `selectedNfts.ts`         | UI selection state      | **Zustand**           |
| `loading`              | `loadingStore.ts`         | UI state                | **Zustand**           |
| `message`              | `messageStore.ts`         | UI state                | **Zustand**           |
| `isDark`               | `darkModeStore.ts`        | UI state + localStorage | **Zustand** + persist |
| `uploadRequestStore`   | `uploadRequestStore.ts`   | UI state                | **Zustand**           |

---

## Part 1: Zustand Stores

### Store: UI State (Loading, Messages)

Create `src/lib/stores/ui-store.ts`:

```typescript
import { create } from 'zustand';

interface UIState {
	loading: boolean;
	message: string;
	setLoading: (loading: boolean) => void;
	setMessage: (message: string) => void;
	reset: () => void;
}

export const useUIStore = create<UIState>((set) => ({
	loading: false,
	message: '',
	setLoading: (loading) => set({ loading }),
	setMessage: (message) => set({ message }),
	reset: () => set({ loading: false, message: '' })
}));

// Helper for setting message with auto-clear
export const setMessageSlow = (message: string, delay = 2000) => {
	useUIStore.getState().setMessage(message);
	setTimeout(() => {
		useUIStore.getState().setMessage('');
	}, delay);
};
```

**Usage in component:**

```tsx
import { useUIStore } from '@/lib/stores/ui-store';

function MyComponent() {
	const { loading, message, setLoading, setMessage, reset } = useUIStore();
	// or pick specific values
	const loading = useUIStore((state) => state.loading);
}
```

---

### Store: Theme (Dark Mode)

Create `src/lib/stores/theme-store.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
	isDark: boolean;
	toggleTheme: () => void;
	setTheme: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
	persist(
		(set, get) => ({
			isDark: false,
			toggleTheme: () => {
				const newValue = !get().isDark;
				set({ isDark: newValue });
				// Update DaisyUI theme attribute
				if (typeof document !== 'undefined') {
					document.documentElement.setAttribute(
						'data-theme',
						newValue ? 'monkedao_dark' : 'monkedao'
					);
				}
			},
			setTheme: (isDark) => {
				set({ isDark });
				if (typeof document !== 'undefined') {
					document.documentElement.setAttribute(
						'data-theme',
						isDark ? 'monkedao_dark' : 'monkedao'
					);
				}
			}
		}),
		{
			name: 'theme-storage'
		}
	)
);
```

---

### Store: Selected NFTs (for Voting)

Create `src/lib/stores/selected-nfts-store.ts`:

```typescript
import { create } from 'zustand';
import type { NftMetadata } from '@/types';

interface SelectedNftsState {
	selectedNfts: NftMetadata[];
	addNft: (nft: NftMetadata) => void;
	removeNft: (nft: NftMetadata) => void;
	toggleNft: (nft: NftMetadata) => void;
	clearSelection: () => void;
	isSelected: (nft: NftMetadata) => boolean;
}

export const useSelectedNftsStore = create<SelectedNftsState>((set, get) => ({
	selectedNfts: [],

	addNft: (nft) =>
		set((state) => ({
			selectedNfts: [...state.selectedNfts, nft]
		})),

	removeNft: (nft) =>
		set((state) => ({
			selectedNfts: state.selectedNfts.filter((n) => n.address !== nft.address)
		})),

	toggleNft: (nft) => {
		const isCurrentlySelected = get().isSelected(nft);
		if (isCurrentlySelected) {
			get().removeNft(nft);
		} else {
			get().addNft(nft);
		}
	},

	clearSelection: () => set({ selectedNfts: [] }),

	isSelected: (nft) => get().selectedNfts.some((n) => n.address === nft.address)
}));
```

---

### Store: Upload Request Status

Create `src/lib/stores/upload-store.ts`:

```typescript
import { create } from 'zustand';

interface UploadState {
	isUploading: boolean;
	uploadProgress: number;
	uploadError: string | null;
	setUploading: (isUploading: boolean) => void;
	setProgress: (progress: number) => void;
	setError: (error: string | null) => void;
	reset: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
	isUploading: false,
	uploadProgress: 0,
	uploadError: null,
	setUploading: (isUploading) => set({ isUploading }),
	setProgress: (progress) => set({ uploadProgress: progress }),
	setError: (error) => set({ uploadError: error }),
	reset: () =>
		set({
			isUploading: false,
			uploadProgress: 0,
			uploadError: null
		})
}));
```

---

## Part 2: React Query Hooks

### Setup: Query Client Provider

Create `src/providers/query-provider.tsx`:

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 60 * 1000, // 1 minute
						refetchOnWindowFocus: false
					}
				}
			})
	);

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	);
}
```

---

### Hook: NFTs Query

Create `src/lib/hooks/use-nfts.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import type { NftMetadata, DelegateAccountType } from '@/types';

interface NftsResponse {
	nfts: NftMetadata[];
	delegateAccount: DelegateAccountType | null;
}

async function fetchNfts(publicKey: string): Promise<NftsResponse> {
	const res = await fetch(`/api/fetchNftsV2/${publicKey}`);
	if (!res.ok) {
		throw new Error('Failed to fetch NFTs');
	}
	return res.json();
}

export function useNfts() {
	const { publicKey, connected } = useWallet();

	return useQuery({
		queryKey: ['nfts', publicKey?.toBase58()],
		queryFn: () => fetchNfts(publicKey!.toBase58()),
		enabled: connected && !!publicKey,
		staleTime: 5 * 60 * 1000 // 5 minutes
	});
}

// Convenience hooks for accessing parts of the data
export function useUserNfts() {
	const { data } = useNfts();
	return data?.nfts ?? [];
}

export function useUserDelegateAccount() {
	const { data } = useNfts();
	return data?.delegateAccount ?? null;
}
```

**This replaces:**

- `nftStore`
- `nftSyncStore` (derived store that watched wallet)
- `nftWalletDisconnectListener`

The `enabled: connected && !!publicKey` option handles the "sync" logic automatically!

---

### Hook: Filtered NFTs (Vote Eligibility)

Create `src/lib/hooks/use-filtered-nfts.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import type { NftMetadata, ProposalItem } from '@/types';

interface FilteredNft {
	nft: NftMetadata;
	accountExists: boolean;
}

async function filterNfts(nfts: NftMetadata[], proposal: ProposalItem): Promise<FilteredNft[]> {
	const res = await fetch('/api/filterNfts', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ nfts, proposal })
	});
	if (!res.ok) {
		throw new Error('Failed to filter NFTs');
	}
	return res.json();
}

export function useFilteredNfts(
	nfts: NftMetadata[] | undefined,
	proposal: ProposalItem | undefined
) {
	return useQuery({
		queryKey: ['filteredNfts', proposal?.proposalId, nfts?.length],
		queryFn: () => filterNfts(nfts!, proposal!),
		enabled: !!nfts && nfts.length > 0 && !!proposal
	});
}

// Derived data
export function useEligibleNfts(
	nfts: NftMetadata[] | undefined,
	proposal: ProposalItem | undefined
) {
	const { data } = useFilteredNfts(nfts, proposal);
	return data?.filter((f) => f.nft.eligible && !f.accountExists) ?? [];
}

export function useAlreadyVotedNfts(
	nfts: NftMetadata[] | undefined,
	proposal: ProposalItem | undefined
) {
	const { data } = useFilteredNfts(nfts, proposal);
	return data?.filter((f) => f.accountExists) ?? [];
}
```

---

### Hook: Delegate Account

Create `src/lib/hooks/use-delegate-account.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import { getDelegateAccount } from '@/lib/utils/solana';
import { useConnection } from '@solana/wallet-adapter-react';

export function useDelegateAccount() {
	const { publicKey, connected } = useWallet();
	const { connection } = useConnection();

	return useQuery({
		queryKey: ['delegateAccount', publicKey?.toBase58()],
		queryFn: async () => {
			const result = await getDelegateAccount(publicKey!, connection);
			return {
				delegateAccount: result?.delegateAccount ?? null,
				address: result?.address ?? null
			};
		},
		enabled: connected && !!publicKey && !!connection
	});
}
```

---

### Hook: SOL Balance

Create `src/lib/hooks/use-balance.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export function useSOLBalance() {
	const { publicKey, connected } = useWallet();
	const { connection } = useConnection();

	return useQuery({
		queryKey: ['solBalance', publicKey?.toBase58()],
		queryFn: async () => {
			const balance = await connection.getBalance(publicKey!, 'confirmed');
			return balance / LAMPORTS_PER_SOL;
		},
		enabled: connected && !!publicKey && !!connection,
		refetchInterval: 30000 // Refetch every 30 seconds
	});
}
```

---

### Hook: Owner Check (Is User Votebank Owner?)

Create `src/lib/hooks/use-owner-check.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Votebank } from '@/lib/anchor/accounts';
import { PublicKey } from '@solana/web3.js';
import { extractOwnersSettingsData } from '@/lib/utils/solana';

export function useIsOwner(votebankAddress: string | undefined) {
	const { publicKey, connected } = useWallet();
	const { connection } = useConnection();

	return useQuery({
		queryKey: ['isOwner', votebankAddress, publicKey?.toBase58()],
		queryFn: async () => {
			const votebankPubkey = new PublicKey(votebankAddress!);
			const votebank = await Votebank.fromAccountAddress(connection, votebankPubkey);
			const owners = extractOwnersSettingsData(votebank.settings);

			if (!owners || owners.length === 0) return false;

			return owners.some((owner) => owner.toBase58() === publicKey!.toBase58());
		},
		enabled: connected && !!publicKey && !!votebankAddress && !!connection
	});
}
```

---

## Part 3: Comparison - Before & After

### Before (Svelte)

```svelte
<script>
	import { nftStore, nftSyncStore } from '$lib/stores/nftStore';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';

	// Manual subscription to keep stores in sync
	$: $nftSyncStore; // Triggers side effect when wallet changes

	// Access data
	$: nfts = $nftStore.data;
	$: isFetching = $nftStore.isFetching;
</script>

{#if isFetching}
	<Loading />
{:else}
	{#each nfts as nft}
		<NFTCard {nft} />
	{/each}
{/if}
```

### After (React)

```tsx
import { useNfts } from '@/lib/hooks/use-nfts';

function MyComponent() {
	const { data, isLoading, error } = useNfts();
	// That's it! No sync logic needed.

	if (isLoading) return <Loading />;
	if (error) return <Error message={error.message} />;

	return (
		<>
			{data?.nfts.map((nft) => (
				<NFTCard key={nft.address} nft={nft} />
			))}
		</>
	);
}
```

---

## Part 4: Complex Example - Proposal Page

### Before (Svelte with $: reactive statements)

```svelte
<script>
	export let data;

	let proposal;
	let voteBankSettings;

	$: if (data && data.proposal) {
		proposal = data.proposal;
	}

	$: if (data && data.voteBankSettings) {
		voteBankSettings = data.voteBankSettings;
	}

	$: isOwner = $ownerCheckStore.isOwner;
	$: isClosed = proposal ? isProposalClosed(proposal) : false;
	$: canVote = !isClosed && $filteredNftStore.eligible.length > 0;
</script>
```

### After (React - cleaner!)

```tsx
import { useIsOwner } from '@/lib/hooks/use-owner-check';
import { useFilteredNfts, useEligibleNfts } from '@/lib/hooks/use-filtered-nfts';
import { useNfts } from '@/lib/hooks/use-nfts';
import { isProposalClosed } from '@/lib/utils/proposal';

interface Props {
  proposal: ProposalItem;
  voteBankSettings: SettingsData[];
  votebankAddress: string;
}

function ProposalPage({ proposal, voteBankSettings, votebankAddress }: Props) {
  const { data: isOwner } = useIsOwner(votebankAddress);
  const { data: nftsData } = useNfts();
  const eligibleNfts = useEligibleNfts(nftsData?.nfts, proposal);

  // Simple computed values - no useEffect needed!
  const isClosed = isProposalClosed(proposal);
  const canVote = !isClosed && eligibleNfts.length > 0;

  return (
    // ...
  );
}
```

---

## Checklist

- [ ] Install Zustand and React Query
- [ ] Create UI store (loading, messages)
- [ ] Create theme store with persist
- [ ] Create selected NFTs store
- [ ] Create upload store
- [ ] Set up QueryProvider
- [ ] Create useNfts hook
- [ ] Create useFilteredNfts hook
- [ ] Create useDelegateAccount hook
- [ ] Create useSOLBalance hook
- [ ] Create useIsOwner hook

---

## Next Steps

→ [03-WALLET-INTEGRATION.md](./03-WALLET-INTEGRATION.md) - Set up Solana wallet adapter for React
