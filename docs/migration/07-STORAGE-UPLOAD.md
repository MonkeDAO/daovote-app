# 07 - Storage & File Upload Migration

## Overview

Shadow Drive is deprecated and needs to be replaced. This document covers modern storage options for proposal document uploads.

---

## Current Shadow Drive Usage

The app uses Shadow Drive for:

1. **Proposal documents** - PDF/HTML files created from the rich text editor
2. **Storage accounts** - Per-user storage buckets on Shadow Drive

**Files involved:**

- `src/lib/drive.ts` - Shadow Drive SDK wrapper
- `src/lib/shdwbalance.ts` - SHDW token balance store
- `src/routes/votebank/[address]/create/+page.svelte` - Upload during proposal creation

---

## Storage Options Comparison

| Option             | Permanence    | Cost        | Complexity | Best For                       |
| ------------------ | ------------- | ----------- | ---------- | ------------------------------ |
| **AWS S3**         | Until deleted | Pay-per-use | Low        | Simple, reliable, centralized  |
| **Cloudflare R2**  | Until deleted | Free egress | Low        | Cost-effective, fast           |
| **Irys + Arweave** | Permanent     | One-time    | Medium     | Blockchain-native, permanent   |
| **IPFS + Pinata**  | While pinned  | Monthly     | Medium     | Decentralized, web3-native     |
| **Vercel Blob**    | Until deleted | Included    | Very Low   | Simple, integrated with Vercel |

---

## Recommended: Cloudflare R2 or Vercel Blob

For a DAO voting app, **Vercel Blob** (if deploying to Vercel) or **Cloudflare R2** are the best choices:

- Simple setup
- Low/no cost
- Fast delivery
- No blockchain dependencies
- Documents don't need to be "permanent" - they're referenced by on-chain proposals

If you want **permanent/decentralized** storage, use **Irys + Arweave**.

---

## Option A: Vercel Blob (Simplest)

### Setup

```bash
npm install @vercel/blob
```

### API Route

Create `src/app/api/upload/route.ts`:

```typescript
import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return NextResponse.json({ error: 'No file provided' }, { status: 400 });
		}

		// Generate unique filename
		const filename = `proposals/${Date.now()}-${file.name}`;

		// Upload to Vercel Blob
		const blob = await put(filename, file, {
			access: 'public'
		});

		return NextResponse.json({
			url: blob.url,
			filename: blob.pathname
		});
	} catch (error) {
		console.error('Upload error:', error);
		return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
	}
}

export const config = {
	api: {
		bodyParser: false
	}
};
```

### Client Hook

Create `src/lib/hooks/use-upload.ts`:

```typescript
import { useState } from 'react';
import { useUploadStore } from '@/lib/stores/upload-store';

interface UploadResult {
	url: string;
	filename: string;
}

export function useUpload() {
	const { setUploading, setProgress, setError, reset } = useUploadStore();

	const upload = async (file: File): Promise<UploadResult | null> => {
		try {
			setUploading(true);
			setProgress(0);

			const formData = new FormData();
			formData.append('file', file);

			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error('Upload failed');
			}

			setProgress(100);
			const result = await response.json();

			return result;
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Upload failed');
			return null;
		} finally {
			setTimeout(() => reset(), 2000);
		}
	};

	return { upload };
}
```

### Environment Variables

```bash
# Vercel automatically provides this when Blob is enabled
BLOB_READ_WRITE_TOKEN=your-token
```

---

## Option B: Cloudflare R2

### Setup

```bash
npm install @aws-sdk/client-s3
```

### API Route

Create `src/app/api/upload/route.ts`:

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';

const S3 = new S3Client({
	region: 'auto',
	endpoint: process.env.R2_ENDPOINT,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID!,
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
	}
});

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return NextResponse.json({ error: 'No file provided' }, { status: 400 });
		}

		const buffer = Buffer.from(await file.arrayBuffer());
		const filename = `proposals/${Date.now()}-${file.name}`;

		await S3.send(
			new PutObjectCommand({
				Bucket: process.env.R2_BUCKET_NAME,
				Key: filename,
				Body: buffer,
				ContentType: file.type
			})
		);

		const url = `${process.env.R2_PUBLIC_URL}/${filename}`;

		return NextResponse.json({ url, filename });
	} catch (error) {
		console.error('Upload error:', error);
		return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
	}
}
```

### Environment Variables

```bash
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=daovote-uploads
R2_PUBLIC_URL=https://your-public-bucket-url.com
```

---

## Option C: Irys + Arweave (Permanent Storage)

For permanent, decentralized storage on Arweave.

### Setup

```bash
npm install @irys/sdk
```

### API Route

Create `src/app/api/upload/route.ts`:

```typescript
import Irys from '@irys/sdk';
import { NextRequest, NextResponse } from 'next/server';

async function getIrys() {
	const irys = new Irys({
		network: 'mainnet', // or 'devnet' for testing
		token: 'solana',
		key: process.env.IRYS_WALLET_PRIVATE_KEY,
		config: {
			providerUrl: process.env.NEXT_PUBLIC_RPC_URL
		}
	});
	return irys;
}

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return NextResponse.json({ error: 'No file provided' }, { status: 400 });
		}

		const irys = await getIrys();
		const buffer = Buffer.from(await file.arrayBuffer());

		// Check price
		const price = await irys.getPrice(buffer.length);
		console.log(`Upload price: ${irys.utils.fromAtomic(price)} SOL`);

		// Fund if needed (you may want to pre-fund the account)
		// await irys.fund(price);

		// Upload
		const receipt = await irys.upload(buffer, {
			tags: [
				{ name: 'Content-Type', value: file.type },
				{ name: 'App-Name', value: 'DAOVote' },
				{ name: 'File-Name', value: file.name }
			]
		});

		const url = `https://arweave.net/${receipt.id}`;

		return NextResponse.json({
			url,
			transactionId: receipt.id,
			permanent: true
		});
	} catch (error) {
		console.error('Upload error:', error);
		return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
	}
}
```

### Environment Variables

```bash
IRYS_WALLET_PRIVATE_KEY=your-base58-private-key
```

### Client-Side Upload (Alternative)

For client-side uploads where the user pays:

```typescript
import { WebIrys } from '@irys/sdk';
import { useWallet } from '@solana/wallet-adapter-react';

export function useIrysUpload() {
	const wallet = useWallet();

	const upload = async (file: File) => {
		const irys = new WebIrys({
			network: 'mainnet',
			token: 'solana',
			wallet: { provider: wallet }
		});

		await irys.ready();

		const buffer = Buffer.from(await file.arrayBuffer());
		const receipt = await irys.upload(buffer, {
			tags: [
				{ name: 'Content-Type', value: file.type },
				{ name: 'App-Name', value: 'DAOVote' }
			]
		});

		return `https://arweave.net/${receipt.id}`;
	};

	return { upload };
}
```

---

## Migration from Shadow Drive

### What to Remove

1. **Dependencies:**

   ```bash
   npm uninstall @shadow-drive/sdk
   ```

2. **Files to delete:**

   - `src/lib/drive.ts`
   - `src/lib/shdwbalance.ts`
   - `src/lib/stores/shdwBalanceStore.ts` (if exists)

3. **Code to remove from proposal creation:**
   - Shadow Drive account creation
   - SHDW balance checks
   - Shadow Drive upload calls

### What to Update

**ProposalForm component:**

```typescript
// Before (Shadow Drive)
const response = await uploadToShadowDrive(connection, wallet, storageAccount, file);
const url = response.finalized_locations[0];

// After (Vercel Blob / R2 / Irys)
const { upload } = useUpload();
const result = await upload(file);
const url = result?.url;
```

**Proposal creation flow:**

```typescript
// Before
1. Check SHDW balance
2. Get/Create Shadow Drive storage account
3. Upload file to Shadow Drive
4. Get finalized URL
5. Create proposal with URL

// After (simplified)
1. Upload file to chosen storage
2. Get URL
3. Create proposal with URL
```

---

## Updated Upload Store

Create `src/lib/stores/upload-store.ts`:

```typescript
import { create } from 'zustand';

interface UploadState {
	isUploading: boolean;
	progress: number;
	error: string | null;
	lastUploadUrl: string | null;

	setUploading: (isUploading: boolean) => void;
	setProgress: (progress: number) => void;
	setError: (error: string | null) => void;
	setLastUploadUrl: (url: string | null) => void;
	reset: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
	isUploading: false,
	progress: 0,
	error: null,
	lastUploadUrl: null,

	setUploading: (isUploading) => set({ isUploading }),
	setProgress: (progress) => set({ progress }),
	setError: (error) => set({ error }),
	setLastUploadUrl: (url) => set({ lastUploadUrl: url }),
	reset: () =>
		set({
			isUploading: false,
			progress: 0,
			error: null,
			lastUploadUrl: null
		})
}));
```

---

## Recommendation Summary

| Scenario               | Recommendation                  |
| ---------------------- | ------------------------------- |
| Deploying to Vercel    | **Vercel Blob** - zero config   |
| Cost-sensitive         | **Cloudflare R2** - free egress |
| Need permanent storage | **Irys + Arweave**              |
| Enterprise/compliance  | **AWS S3**                      |

For most DAO use cases, **Vercel Blob** or **Cloudflare R2** is the best choice - simple, cheap, and reliable.

---

## Checklist

- [ ] Choose storage provider
- [ ] Set up storage account/bucket
- [ ] Create upload API route
- [ ] Create useUpload hook
- [ ] Update upload store
- [ ] Remove Shadow Drive dependencies
- [ ] Update ProposalForm to use new upload
- [ ] Remove SHDW balance checks
- [ ] Test upload flow
- [ ] Update environment variables

---

## Next Steps

→ [08-UI-STYLING.md](./08-UI-STYLING.md) - UI framework and styling setup
