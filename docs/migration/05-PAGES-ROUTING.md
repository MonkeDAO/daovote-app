# 05 - Pages & Routing

## Overview

This document covers converting SvelteKit pages to Next.js App Router pages, including data fetching patterns.

---

## Route Structure Comparison

| SvelteKit                                    | Next.js                               |
| -------------------------------------------- | ------------------------------------- |
| `src/routes/+page.svelte`                    | `src/app/page.tsx`                    |
| `src/routes/+page.ts` (loader)               | Server Component or React Query       |
| `src/routes/about/+page.svelte`              | `src/app/about/page.tsx`              |
| `src/routes/votebank/[address]/+page.svelte` | `src/app/votebank/[address]/page.tsx` |
| `src/routes/+layout.svelte`                  | `src/app/layout.tsx`                  |
| `src/routes/+error.svelte`                   | `src/app/error.tsx`                   |

---

## Page List & Complexity

| Page            | SvelteKit Path                      | Priority | Complexity |
| --------------- | ----------------------------------- | -------- | ---------- |
| Home            | `/`                                 | High     | Medium     |
| Votebanks List  | `/votebanks`                        | Medium   | Low        |
| Votebank Detail | `/votebank/[address]`               | Medium   | Low        |
| Proposals List  | `/votebank/[address]/proposals`     | High     | Medium     |
| Proposal Detail | `/votebank/[address]/proposal/[id]` | High     | **High**   |
| Create Proposal | `/votebank/[address]/create`        | High     | **High**   |
| Delegate Create | `/delegate/create`                  | High     | Medium     |
| Delegate Sign   | `/delegate/sign/[address]`          | High     | Medium     |
| About           | `/about`                            | Low      | Low        |

---

## Data Fetching Patterns

### Pattern 1: Server Component (Static/SSR data)

```tsx
// Good for: Initial page data, SEO-important content
// src/app/votebanks/page.tsx

async function getVotebanks() {
	const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/votebanks`, {
		cache: 'no-store' // or 'force-cache' for static
	});
	return res.json();
}

export default async function VotebanksPage() {
	const votebanks = await getVotebanks();

	return (
		<div>
			{votebanks.map((vb) => (
				<VotebankCard key={vb} address={vb} />
			))}
		</div>
	);
}
```

### Pattern 2: Client Component with React Query (Dynamic data)

```tsx
// Good for: User-specific data, frequently changing data
// src/app/proposal/[id]/page.tsx
'use client';

import { useProposal } from '@/lib/hooks/use-proposal';

export default function ProposalPage({ params }: { params: { id: string } }) {
	const { data, isLoading, error } = useProposal(params.id);

	if (isLoading) return <Loading />;
	if (error) return <Error />;

	return <ProposalView proposal={data} />;
}
```

### Pattern 3: Hybrid (Server + Client)

```tsx
// Good for: SEO data + user-specific data
// src/app/votebank/[address]/proposal/[id]/page.tsx

// Server Component wrapper
export default async function ProposalPageWrapper({
	params
}: {
	params: { address: string; id: string };
}) {
	// Fetch static proposal data server-side
	const proposal = await getProposal(params.address, params.id);

	return <ProposalClient initialProposal={proposal} votebankAddress={params.address} />;
}

// Client Component for interactive parts
('use client');
function ProposalClient({ initialProposal, votebankAddress }) {
	// Use React Query for user-specific data
	const { data: nfts } = useNfts();
	const { data: filteredNfts } = useFilteredNfts(nfts, initialProposal);

	return <ProposalView proposal={initialProposal} eligibleNfts={filteredNfts} />;
}
```

---

## Page Conversions

### 1. Home Page (`/`)

**SvelteKit:** Uses streaming with `data.streamed`

**Next.js:** `src/app/page.tsx`

```tsx
import { Suspense } from 'react';
import { ProposalList } from '@/components/proposal/proposal-list';
import { ProposalListSkeleton } from '@/components/skeletons/proposal-list-skeleton';

async function getProposals() {
	const res = await fetch(
		`${process.env.NEXT_PUBLIC_APP_URL}/api/votebank/${process.env.NEXT_PUBLIC_VOTEBANK}/proposals`,
		{ next: { revalidate: 60 } } // Revalidate every 60 seconds
	);
	return res.json();
}

export default async function HomePage() {
	const proposalsPromise = getProposals();

	return (
		<main className="container mx-auto px-4 py-8">
			<h1 className="mb-8 text-3xl font-bold">Proposals</h1>

			<Suspense fallback={<ProposalListSkeleton />}>
				<ProposalListAsync proposalsPromise={proposalsPromise} />
			</Suspense>
		</main>
	);
}

async function ProposalListAsync({ proposalsPromise }: { proposalsPromise: Promise<any> }) {
	const { open_proposals, closed_proposals } = await proposalsPromise;

	return (
		<div className="space-y-8">
			<section>
				<h2 className="mb-4 text-xl font-semibold">Open Proposals</h2>
				<ProposalList proposals={open_proposals} />
			</section>

			<section>
				<h2 className="mb-4 text-xl font-semibold">Closed Proposals</h2>
				<ProposalList proposals={closed_proposals} />
			</section>
		</div>
	);
}
```

---

### 2. Proposal Detail Page (Most Complex)

**Next.js:** `src/app/votebank/[address]/proposal/[id]/page.tsx`

```tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { fetchProposalById, getEnvNetwork } from '@/lib/utils/solana';
import { Votebank } from '@/lib/anchor/accounts';
import { PublicKey } from '@solana/web3.js';
import { ProposalPageClient } from './proposal-client';

interface Props {
	params: { address: string; id: string };
}

async function getProposalData(address: string, id: string) {
	const connection = getEnvNetwork();
	const votebankPubkey = new PublicKey(address);

	const [votebank, proposal] = await Promise.all([
		Votebank.fromAccountAddress(connection, votebankPubkey),
		fetchProposalById(parseInt(id), votebankPubkey, connection)
	]);

	if (!proposal) return null;

	return {
		proposal,
		voteBankSettings: votebank.settings
	};
}

export default async function ProposalPage({ params }: Props) {
	const data = await getProposalData(params.address, params.id);

	if (!data) {
		notFound();
	}

	return (
		<Suspense fallback={<div>Loading...</div>}>
			<ProposalPageClient
				initialProposal={data.proposal}
				voteBankSettings={data.voteBankSettings}
				votebankAddress={params.address}
				proposalId={params.id}
			/>
		</Suspense>
	);
}
```

**Client Component:** `src/app/votebank/[address]/proposal/[id]/proposal-client.tsx`

```tsx
'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useNfts } from '@/lib/hooks/use-nfts';
import { useFilteredNfts, useEligibleNfts } from '@/lib/hooks/use-filtered-nfts';
import { useIsOwner } from '@/lib/hooks/use-owner-check';
import { useSelectedNftsStore } from '@/lib/stores/selected-nfts-store';
import { ProposalView } from '@/components/proposal/proposal-view';
import { NFTGrid } from '@/components/nft/nft-grid';
import { VoteConfirmationModal } from '@/components/vote/vote-confirmation-modal';
import { isProposalClosed } from '@/lib/utils/proposal';
import type { ProposalItem, SettingsData } from '@/types';

interface Props {
	initialProposal: ProposalItem;
	voteBankSettings: SettingsData[];
	votebankAddress: string;
	proposalId: string;
}

export function ProposalPageClient({
	initialProposal,
	voteBankSettings,
	votebankAddress,
	proposalId
}: Props) {
	const { connected, publicKey } = useWallet();
	const { data: nftsData, isLoading: nftsLoading } = useNfts();
	const eligibleNfts = useEligibleNfts(nftsData?.nfts, initialProposal);
	const { data: isOwner } = useIsOwner(votebankAddress);
	const { selectedNfts, clearSelection } = useSelectedNftsStore();

	// Computed values - no useEffect needed!
	const isClosed = isProposalClosed(initialProposal);
	const canVote = connected && !isClosed && eligibleNfts.length > 0;

	return (
		<div className="container mx-auto px-4 py-8">
			<ProposalView
				proposal={initialProposal}
				settings={voteBankSettings}
				isOwner={isOwner ?? false}
				onVote={() => {
					/* open modal */
				}}
				onClose={() => {
					/* close proposal */
				}}
			/>

			{connected && !isClosed && (
				<section className="mt-8">
					<h2 className="mb-4 text-xl font-semibold">Your NFTs</h2>
					{nftsLoading ? (
						<div>Loading NFTs...</div>
					) : (
						<NFTGrid nfts={eligibleNfts} selectable={canVote} />
					)}
				</section>
			)}

			<VoteConfirmationModal
				proposal={initialProposal}
				selectedNfts={selectedNfts}
				onConfirm={async (optionId) => {
					// Handle vote
					clearSelection();
				}}
			/>
		</div>
	);
}
```

---

### 3. Delegate Create Page

**Next.js:** `src/app/delegate/create/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useDelegateAccount } from '@/lib/hooks/use-delegate-account';
import { useWalletConnection } from '@/lib/hooks/use-wallet-connection';
import { useQueryClient } from '@tanstack/react-query';
import { DelegateCreateForm } from '@/components/delegate/delegate-create-form';
import { DelegateManageView } from '@/components/delegate/delegate-manage-view';
import { WalletButton } from '@/components/wallet/wallet-button';

export default function DelegateCreatePage() {
	const { connected, publicKey } = useWallet();
	const { data: delegateData, isLoading } = useDelegateAccount();
	const queryClient = useQueryClient();

	const handleSuccess = () => {
		// Invalidate and refetch delegate account data
		queryClient.invalidateQueries({ queryKey: ['delegateAccount'] });
	};

	if (!connected) {
		return (
			<div className="container mx-auto px-4 py-8 text-center">
				<h1 className="mb-4 text-2xl font-bold">Connect Wallet</h1>
				<p className="mb-4">Please connect your wallet to manage delegation.</p>
				<WalletButton />
			</div>
		);
	}

	if (isLoading) {
		return <div>Loading...</div>;
	}

	// Show create form if no delegate account exists
	if (!delegateData?.delegateAccount) {
		return <DelegateCreateForm onSuccess={handleSuccess} />;
	}

	// Show manage view if delegate account exists
	return (
		<DelegateManageView
			delegateAccount={delegateData.delegateAccount}
			delegateAccountAddress={delegateData.address}
			onSuccess={handleSuccess}
		/>
	);
}
```

---

### 4. Delegate Sign Page

**Next.js:** `src/app/delegate/sign/[delegateAccountAddress]/page.tsx`

```tsx
import { redirect } from 'next/navigation';
import { DelegateSignClient } from './delegate-sign-client';

interface Props {
	params: { delegateAccountAddress: string };
	searchParams: { signature?: string };
}

async function verifySignature(address: string, signature: string) {
	const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generatelink/verify`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ delegateAccountAddress: address, signature })
	});
	return res.json();
}

export default async function DelegateSignPage({ params, searchParams }: Props) {
	const { delegateAccountAddress } = params;
	const { signature } = searchParams;

	if (!signature) {
		redirect('/delegate/create');
	}

	const { valid, error } = await verifySignature(delegateAccountAddress, signature);

	if (!valid) {
		return (
			<div className="container mx-auto px-4 py-8">
				<h1 className="text-2xl font-bold text-red-600">Invalid Link</h1>
				<p>{error || 'This delegation link is invalid or has expired.'}</p>
			</div>
		);
	}

	return (
		<DelegateSignClient delegateAccountAddress={delegateAccountAddress} signature={signature} />
	);
}
```

---

## Navigation

### SvelteKit

```svelte
<script>
	import { goto } from '$app/navigation';

	function handleClick() {
		goto('/votebank/abc123');
	}
</script>
```

### Next.js

```tsx
'use client';
import { useRouter } from 'next/navigation';

function MyComponent() {
	const router = useRouter();

	function handleClick() {
		router.push('/votebank/abc123');
	}
}
```

---

## Loading & Error States

### Loading UI

Create `src/app/loading.tsx` for route-level loading:

```tsx
export default function Loading() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
		</div>
	);
}
```

### Error UI

Create `src/app/error.tsx`:

```tsx
'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
	return (
		<div className="container mx-auto px-4 py-8 text-center">
			<h1 className="mb-4 text-2xl font-bold text-red-600">Something went wrong</h1>
			<p className="mb-4">{error.message}</p>
			<button onClick={reset} className="btn btn-primary">
				Try again
			</button>
		</div>
	);
}
```

### Not Found

Create `src/app/not-found.tsx`:

```tsx
export default function NotFound() {
	return (
		<div className="container mx-auto px-4 py-8 text-center">
			<h1 className="mb-4 text-4xl font-bold">404</h1>
			<p>Page not found</p>
		</div>
	);
}
```

---

## Checklist

- [ ] Create app directory structure
- [ ] Implement root layout with providers
- [ ] Create home page with proposal listing
- [ ] Create votebanks list page
- [ ] Create votebank detail page
- [ ] Create proposals list page
- [ ] Create proposal detail page (complex)
- [ ] Create proposal create page (complex)
- [ ] Create delegate create page
- [ ] Create delegate sign page
- [ ] Create about page
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add not-found handling

---

## Next Steps

→ [06-COMPONENTS.md](./06-COMPONENTS.md) - Convert Svelte components to React
