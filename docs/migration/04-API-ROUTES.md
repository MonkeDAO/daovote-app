# 04 - API Routes

## Overview

This document covers converting SvelteKit API routes (`+server.ts`) to Next.js App Router API routes (`route.ts`).

This is one of the **easiest parts** of the migration - the mapping is almost 1:1.

---

## Route Mapping

| SvelteKit Path                                                | Next.js Path                                        |
| ------------------------------------------------------------- | --------------------------------------------------- |
| `src/routes/api/votebanks.json/+server.ts`                    | `src/app/api/votebanks/route.ts`                    |
| `src/routes/api/votebank/[address]/proposals.json/+server.ts` | `src/app/api/votebank/[address]/proposals/route.ts` |
| `src/routes/api/fetchNfts/[publicKey]/+server.ts`             | `src/app/api/fetchNfts/[publicKey]/route.ts`        |
| `src/routes/api/fetchNftsV2/[publicKey]/+server.ts`           | `src/app/api/fetchNftsV2/[publicKey]/route.ts`      |
| `src/routes/api/fetchDelegate/[publicKey]/+server.ts`         | `src/app/api/fetchDelegate/[publicKey]/route.ts`    |
| `src/routes/api/filterNfts/+server.ts`                        | `src/app/api/filterNfts/route.ts`                   |
| `src/routes/api/generatelink/+server.ts`                      | `src/app/api/generatelink/route.ts`                 |
| `src/routes/api/generatelink/verify/+server.ts`               | `src/app/api/generatelink/verify/route.ts`          |

---

## Conversion Pattern

### SvelteKit Pattern

```typescript
// src/routes/api/example/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, url }) => {
	const { id } = params;
	const query = url.searchParams.get('query');

	// Do something
	const data = await fetchData(id);

	return json(data);
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();

	// Do something
	const result = await processData(body);

	return json(result);
};
```

### Next.js Pattern

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
	const { id } = params;
	const query = request.nextUrl.searchParams.get('query');

	// Do something
	const data = await fetchData(id);

	return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
	const body = await request.json();

	// Do something
	const result = await processData(body);

	return NextResponse.json(result);
}
```

---

## Route Conversions

### 1. `/api/votebanks`

**SvelteKit:** `src/routes/api/votebanks.json/+server.ts`

**Next.js:** `src/app/api/votebanks/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { fetchBanks } from '@/lib/utils/solana';

export async function GET() {
	try {
		const banks = await fetchBanks();
		return NextResponse.json(banks);
	} catch (error) {
		console.error('Error fetching votebanks:', error);
		return NextResponse.json({ error: 'Failed to fetch votebanks' }, { status: 500 });
	}
}
```

---

### 2. `/api/votebank/[address]/proposals`

**SvelteKit:** `src/routes/api/votebank/[address]/proposals.json/+server.ts`

**Next.js:** `src/app/api/votebank/[address]/proposals/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { Votebank } from '@/lib/anchor/accounts';
import { fetchProposals, getEnvNetwork } from '@/lib/utils/solana';

export async function GET(request: NextRequest, { params }: { params: { address: string } }) {
	try {
		const { address } = params;
		const connection = getEnvNetwork();
		const votebankPubkey = new PublicKey(address);

		const votebank = await Votebank.fromAccountAddress(connection, votebankPubkey);

		const [openProposals, closedProposals] = await Promise.all([
			fetchProposals(votebank.openProposals, connection),
			fetchProposals(votebank.closedProposals, connection)
		]);

		return NextResponse.json({
			open_proposals: openProposals,
			closed_proposals: closedProposals
		});
	} catch (error) {
		console.error('Error fetching proposals:', error);
		return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
	}
}
```

---

### 3. `/api/fetchNftsV2/[publicKey]`

**SvelteKit:** `src/routes/api/fetchNftsV2/[publicKey]/+server.ts`

**Next.js:** `src/app/api/fetchNftsV2/[publicKey]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { getDelegateAccount, getEnvNetwork } from '@/lib/utils/solana';

// Private env var - only available server-side
const HELIUS_URL = process.env.PRIVATE_HELIUS_URL;

export async function GET(request: NextRequest, { params }: { params: { publicKey: string } }) {
	try {
		const { publicKey } = params;

		if (!HELIUS_URL) {
			return NextResponse.json({ error: 'Helius URL not configured' }, { status: 500 });
		}

		// Fetch NFTs from Helius
		const response = await fetch(HELIUS_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 'my-id',
				method: 'getAssetsByOwner',
				params: {
					ownerAddress: publicKey,
					page: 1,
					limit: 1000
				}
			})
		});

		const { result } = await response.json();

		// Get delegate account
		const connection = getEnvNetwork();
		const pubkey = new PublicKey(publicKey);
		const delegateAccountResult = await getDelegateAccount(pubkey, connection);

		// Transform NFTs to your format
		const nfts = transformHeliusNfts(result?.items || []);

		return NextResponse.json({
			nfts,
			delegateAccount: delegateAccountResult?.delegateAccount || null
		});
	} catch (error) {
		console.error('Error fetching NFTs:', error);
		return NextResponse.json({ error: 'Failed to fetch NFTs' }, { status: 500 });
	}
}

function transformHeliusNfts(items: any[]) {
	// Copy your transformation logic from the Svelte version
	return items.map((item) => ({
		address: item.id,
		json: item.content?.metadata,
		collection: item.grouping?.find((g: any) => g.group_key === 'collection')?.group_value,
		eligible: false // Will be determined by filterNfts
	}));
}
```

---

### 4. `/api/fetchDelegate/[publicKey]`

**Next.js:** `src/app/api/fetchDelegate/[publicKey]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { getDelegateAccount, getEnvNetwork } from '@/lib/utils/solana';

export async function GET(request: NextRequest, { params }: { params: { publicKey: string } }) {
	try {
		const { publicKey } = params;
		const connection = getEnvNetwork();
		const pubkey = new PublicKey(publicKey);

		const result = await getDelegateAccount(pubkey, connection);

		return NextResponse.json({
			delegateAccount: result?.delegateAccount || null,
			address: result?.address?.toBase58() || null
		});
	} catch (error) {
		console.error('Error fetching delegate:', error);
		return NextResponse.json({ error: 'Failed to fetch delegate account' }, { status: 500 });
	}
}
```

---

### 5. `/api/filterNfts` (POST)

**Next.js:** `src/app/api/filterNfts/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { voteAccountPdaExists, getEnvNetwork } from '@/lib/utils/solana';
import type { NftMetadata, ProposalItem } from '@/types';

interface FilterRequest {
	nfts: NftMetadata[];
	proposal: ProposalItem;
}

export async function POST(request: NextRequest) {
	try {
		const { nfts, proposal }: FilterRequest = await request.json();
		const connection = getEnvNetwork();

		// Check vote account existence for each NFT
		const results = await Promise.all(
			nfts.map(async (nft) => {
				const accountExists = await voteAccountPdaExists(
					new PublicKey(nft.address),
					proposal.proposalId,
					connection
				);
				return { nft, accountExists };
			})
		);

		return NextResponse.json(results);
	} catch (error) {
		console.error('Error filtering NFTs:', error);
		return NextResponse.json({ error: 'Failed to filter NFTs' }, { status: 500 });
	}
}
```

---

### 6. `/api/generatelink` (POST)

**Next.js:** `src/app/api/generatelink/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const SALT = process.env.PRIVATE_SALT || 'default-salt';

export async function POST(request: NextRequest) {
	try {
		const { delegateAccountAddress } = await request.json();

		if (!delegateAccountAddress) {
			return NextResponse.json({ error: 'delegateAccountAddress is required' }, { status: 400 });
		}

		// Generate HMAC signature
		const signature = crypto
			.createHmac('sha256', SALT)
			.update(delegateAccountAddress)
			.digest('hex');

		// Build link
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
		const link = `${baseUrl}/delegate/sign/${delegateAccountAddress}?signature=${signature}`;

		return NextResponse.json({ link });
	} catch (error) {
		console.error('Error generating link:', error);
		return NextResponse.json({ error: 'Failed to generate link' }, { status: 500 });
	}
}
```

---

### 7. `/api/generatelink/verify` (POST)

**Next.js:** `src/app/api/generatelink/verify/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const SALT = process.env.PRIVATE_SALT || 'default-salt';

export async function POST(request: NextRequest) {
	try {
		const { delegateAccountAddress, signature } = await request.json();

		if (!delegateAccountAddress || !signature) {
			return NextResponse.json({ valid: false, error: 'Missing required fields' }, { status: 400 });
		}

		// Verify HMAC signature
		const expectedSignature = crypto
			.createHmac('sha256', SALT)
			.update(delegateAccountAddress)
			.digest('hex');

		const valid = signature === expectedSignature;

		if (!valid) {
			return NextResponse.json({
				valid: false,
				error: 'Invalid signature'
			});
		}

		return NextResponse.json({ valid: true });
	} catch (error) {
		console.error('Error verifying link:', error);
		return NextResponse.json({ valid: false, error: 'Verification failed' }, { status: 500 });
	}
}
```

---

## Environment Variables Note

In Next.js:

- **Public vars** (accessible in browser): Must be prefixed with `NEXT_PUBLIC_`
- **Private vars** (server-only): No prefix needed, only accessible in API routes and Server Components

```bash
# .env.local
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta    # Available everywhere
PRIVATE_HELIUS_URL=https://...              # Only in API routes
PRIVATE_SALT=your-secret                    # Only in API routes
```

---

## Error Handling Pattern

Create a consistent error response helper:

```typescript
// src/lib/utils/api.ts
import { NextResponse } from 'next/server';

export function apiError(message: string, status: number = 500) {
	return NextResponse.json({ error: message }, { status });
}

export function apiSuccess<T>(data: T) {
	return NextResponse.json(data);
}
```

Usage:

```typescript
import { apiError, apiSuccess } from '@/lib/utils/api';

export async function GET() {
	try {
		const data = await fetchSomething();
		return apiSuccess(data);
	} catch (error) {
		return apiError('Something went wrong', 500);
	}
}
```

---

## Checklist

- [ ] Create `src/app/api/` directory structure
- [ ] Convert `/api/votebanks` route
- [ ] Convert `/api/votebank/[address]/proposals` route
- [ ] Convert `/api/fetchNftsV2/[publicKey]` route
- [ ] Convert `/api/fetchDelegate/[publicKey]` route
- [ ] Convert `/api/filterNfts` route
- [ ] Convert `/api/generatelink` route
- [ ] Convert `/api/generatelink/verify` route
- [ ] Create API utility helpers
- [ ] Test all endpoints with Postman/curl

---

## Next Steps

→ [05-PAGES-ROUTING.md](./05-PAGES-ROUTING.md) - Convert pages and implement data fetching
