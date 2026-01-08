# 01 - Project Setup

## Overview

This document covers setting up the new Next.js project with all required dependencies.

---

## Important: Anchor Version Compatibility

### Current State

Your app uses the **older Anchor package**:

```json
"@project-serum/anchor": "0.24.2"
```

The `create-solana-dapp` templates use the **newer package**:

```json
"@coral-xyz/anchor": "^0.31.1"
```

### Recommendation: Keep Old Version

For this migration, we'll **keep the old Anchor version** because:

1. Your on-chain program doesn't change
2. Your `src/lib/anchor/` code was generated with Solita for 0.24.2
3. The wallet adapter works with any Anchor version
4. Upgrading Anchor can be done separately later

### What This Means

- We'll use `@project-serum/anchor` 0.24.2
- We'll copy over all `src/lib/anchor/` code unchanged
- We won't use `create-solana-dapp` templates directly (they use newer Anchor)
- We'll manually set up the Next.js project

---

## Step 1: Create Next.js Project

```bash
# Create new Next.js project with TypeScript and App Router
npx create-next-app@latest daovote-nextjs --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd daovote-nextjs
```

### Project Structure

```
daovote-nextjs/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   ├── api/                # API routes
│   │   ├── votebank/           # Votebank routes
│   │   └── delegate/           # Delegate routes
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── wallet/             # Wallet components
│   │   ├── proposal/           # Proposal components
│   │   └── ...
│   ├── lib/
│   │   ├── anchor/             # COPY FROM SVELTE (unchanged)
│   │   ├── stores/             # Zustand stores
│   │   ├── hooks/              # React Query hooks
│   │   └── utils/              # COPY FROM SVELTE (mostly unchanged)
│   ├── providers/              # Context providers
│   └── types/                  # TypeScript types
├── public/                     # Static assets
└── ...
```

---

## Step 2: Install Dependencies

### Core Solana Dependencies

```bash
npm install \
  @solana/web3.js@^1.75.0 \
  @solana/wallet-adapter-base@^0.9.23 \
  @solana/wallet-adapter-react@^0.15.35 \
  @solana/wallet-adapter-react-ui@^0.9.35 \
  @solana/wallet-adapter-wallets@^0.19.32 \
  @solana/spl-token@^0.3.8 \
  @project-serum/anchor@0.24.2
```

### Beet (for Anchor account deserialization)

```bash
npm install \
  @metaplex-foundation/beet@^0.7.1 \
  @metaplex-foundation/beet-solana@^0.4.0
```

> **Note:** We do NOT need `@metaplex-foundation/js` anymore!
> NFTs are fetched via Helius DAS API, which is faster and more reliable.
> The `beet` packages are still needed for deserializing Anchor account data.

### Metaplex & NFT Dependencies

```bash
npm install \
  @metaplex-foundation/js@^0.18.3 \
  @metaplex-foundation/beet@^0.7.1 \
  @metaplex-foundation/beet-solana@^0.4.0
```

### File Upload Storage (choose one)

```bash
# Option A: Vercel Blob (simplest if using Vercel)
npm install @vercel/blob

# Option B: Cloudflare R2 / AWS S3
npm install @aws-sdk/client-s3

# Option C: Irys + Arweave (permanent/decentralized)
npm install @irys/sdk
```

> **Note:** Shadow Drive is deprecated. See [07-STORAGE-UPLOAD.md](./07-STORAGE-UPLOAD.md) for details.

### State Management

```bash
npm install \
  zustand@^4.5.0 \
  @tanstack/react-query@^5.17.0
```

### UI Dependencies

```bash
npm install \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-slot \
  class-variance-authority \
  clsx \
  tailwind-merge \
  lucide-react \
  sonner \
  chart.js \
  react-chartjs-2 \
  @tiptap/react \
  @tiptap/starter-kit \
  @tiptap/pm \
  date-fns \
  react-datepicker
```

### Dev Dependencies

```bash
npm install -D \
  @types/react-datepicker \
  daisyui@^3.7.3
```

---

## Step 3: Install shadcn/ui

```bash
npx shadcn@latest init
```

When prompted:

- Style: Default
- Base color: Slate (or customize later)
- CSS variables: Yes

### Install shadcn components we'll need

```bash
npx shadcn@latest add button card dialog dropdown-menu input label tabs toast badge progress skeleton table
```

---

## Step 4: Configure Tailwind + DaisyUI

Update `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';
import daisyui from 'daisyui';

const config: Config = {
	darkMode: ['class'],
	content: [
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}'
	],
	theme: {
		extend: {
			colors: {
				// Your MonkeDAO colors - copy from existing tailwind.config.js
			}
		}
	},
	plugins: [require('tailwindcss-animate'), daisyui],
	daisyui: {
		themes: [
			{
				monkedao: {
					// Copy your existing DaisyUI theme
					primary: '#4e44ce',
					secondary: '#f000b8',
					accent: '#37cdbe',
					neutral: '#3d4451',
					'base-100': '#ffffff'
				},
				monkedao_dark: {
					// Copy your existing dark theme
					primary: '#4e44ce',
					'base-100': '#1d1d1d'
				}
			}
		]
	}
};

export default config;
```

---

## Step 5: Environment Variables

Create `.env.local`:

```bash
# Public (accessible in browser)
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_RPC_URL=https://your-rpc-url
NEXT_PUBLIC_VOTEBANK=your-votebank-address
NEXT_PUBLIC_VOTE_PROGRAM=mdVo394XANGMrVXZCVAaX3AMHYvtTxXwg1sQmDSY1W1
NEXT_PUBLIC_COLLECTION_ADDRESSES=collection1,collection2
NEXT_PUBLIC_COLLECTION_SIZE=5000
NEXT_PUBLIC_IGNORED_PROPOSALS=
NEXT_PUBLIC_ENABLE_FEE_PAYER=false

# Private (server-only)
PRIVATE_HELIUS_URL=https://your-helius-url
PRIVATE_SALT=your-secret-salt
```

### Environment Variable Mapping

| SvelteKit               | Next.js                                                 |
| ----------------------- | ------------------------------------------------------- |
| `PUBLIC_SOLANA_NETWORK` | `NEXT_PUBLIC_SOLANA_NETWORK`                            |
| `PUBLIC_RPC_URL`        | `NEXT_PUBLIC_RPC_URL`                                   |
| `PRIVATE_HELIUS_URL`    | `PRIVATE_HELIUS_URL` (no change needed for server-only) |

---

## Step 6: Copy Unchanged Files

### From `src/lib/anchor/` (copy entire directory)

```
anchor/
├── accounts/           # All account types
├── instructions/       # All instructions
├── types/              # All types
├── errors/             # Error handling
└── omcvote/
    └── omcvote.json    # IDL
```

### From `src/lib/utils/` (copy and adjust imports)

```
utils/
├── solana.ts           # Update env var imports
├── votehelpers.ts      # No changes
├── proposal.ts         # No changes
├── date.ts             # No changes
├── retry.ts            # No changes
└── cache.ts            # No changes
```

### From `src/lib/types.d.ts`

Copy the entire types file.

---

## Step 7: Node.js Polyfills

Solana libraries need Buffer polyfill. Create `src/lib/polyfills.ts`:

```typescript
import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
	window.Buffer = Buffer;
}
```

Import in `src/app/layout.tsx`:

```typescript
import '@/lib/polyfills';
```

Or configure in `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
	webpack: (config) => {
		config.resolve.fallback = {
			...config.resolve.fallback,
			fs: false,
			net: false,
			tls: false
		};
		return config;
	}
};

module.exports = nextConfig;
```

---

## Step 8: Verify Setup

Create a simple test page to verify everything works:

```typescript
// src/app/test/page.tsx
'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function TestPage() {
	const { publicKey, connected } = useWallet();

	return (
		<div className="p-8">
			<h1 className="mb-4 text-2xl font-bold">Setup Test</h1>
			<WalletMultiButton />
			{connected && <p className="mt-4">Connected: {publicKey?.toBase58()}</p>}
		</div>
	);
}
```

Run:

```bash
npm run dev
```

Visit `http://localhost:3000/test` and verify wallet connection works.

---

## Checklist

- [ ] Next.js project created with App Router
- [ ] All Solana dependencies installed (with old Anchor 0.24.2)
- [ ] shadcn/ui initialized and components added
- [ ] Tailwind + DaisyUI configured with MonkeDAO themes
- [ ] Environment variables configured
- [ ] Anchor code copied from Svelte project
- [ ] Utils copied and imports updated
- [ ] Types copied
- [ ] Polyfills configured
- [ ] Test page works with wallet connection

---

## Next Steps

→ [02-STATE-MANAGEMENT.md](./02-STATE-MANAGEMENT.md) - Set up Zustand stores and React Query
