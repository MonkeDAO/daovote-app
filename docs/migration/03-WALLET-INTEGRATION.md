# 03 - Wallet Integration

## Overview

This document covers setting up Solana wallet integration using `@solana/wallet-adapter-react` to replace `@svelte-on-solana/wallet-adapter-*`.

---

## Package Comparison

| Svelte                                    | React                             |
| ----------------------------------------- | --------------------------------- |
| `@svelte-on-solana/wallet-adapter-core`   | `@solana/wallet-adapter-react`    |
| `@svelte-on-solana/wallet-adapter-ui`     | `@solana/wallet-adapter-react-ui` |
| `@svelte-on-solana/wallet-adapter-anchor` | Custom hook (see below)           |

The wallet adapters themselves (Phantom, Backpack, etc.) are the same:

- `@solana/wallet-adapter-wallets` (unchanged)

---

## Step 1: Create Wallet Context Provider

Create `src/providers/wallet-provider.tsx`:

```typescript
'use client';

import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
	PhantomWalletAdapter,
	SolflareWalletAdapter,
	BackpackWalletAdapter,
	GlowWalletAdapter,
	TorusWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
	children: React.ReactNode;
}

export function SolanaWalletProvider({ children }: Props) {
	// Get network from env
	const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet') as WalletAdapterNetwork;

	// Use custom RPC URL or fall back to public endpoint
	const endpoint = useMemo(() => {
		const customRpc = process.env.NEXT_PUBLIC_RPC_URL;
		if (customRpc) return customRpc;
		return clusterApiUrl(network);
	}, [network]);

	// Initialize wallets
	const wallets = useMemo(
		() => [
			new PhantomWalletAdapter(),
			new SolflareWalletAdapter(),
			new BackpackWalletAdapter(),
			new GlowWalletAdapter(),
			new TorusWalletAdapter()
		],
		[network]
	);

	return (
		<ConnectionProvider endpoint={endpoint}>
			<WalletProvider wallets={wallets} autoConnect>
				<WalletModalProvider>{children}</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	);
}
```

---

## Step 2: Create Anchor/Program Hook

This replaces the `workSpace` store from `@svelte-on-solana/wallet-adapter-anchor`.

Create `src/lib/hooks/use-anchor-program.ts`:

```typescript
import { useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import idl from '@/lib/anchor/omcvote/omcvote.json';

// Your program ID
const PROGRAM_ID = new PublicKey(
	process.env.NEXT_PUBLIC_VOTE_PROGRAM || 'mdVo394XANGMrVXZCVAaX3AMHYvtTxXwg1sQmDSY1W1'
);

export function useAnchorProgram() {
	const { connection } = useConnection();
	const wallet = useWallet();

	const provider = useMemo(() => {
		if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
			return null;
		}

		return new AnchorProvider(
			connection,
			{
				publicKey: wallet.publicKey,
				signTransaction: wallet.signTransaction,
				signAllTransactions: wallet.signAllTransactions
			},
			{ commitment: 'confirmed' }
		);
	}, [connection, wallet]);

	const program = useMemo(() => {
		if (!provider) return null;
		return new Program(idl as any, PROGRAM_ID, provider);
	}, [provider]);

	return {
		program,
		provider,
		connection,
		wallet,
		ready: !!program && !!provider && wallet.connected
	};
}
```

---

## Step 3: Create Combined Wallet Hook

This replaces `walletProgramConnection` from the Svelte app.

Create `src/lib/hooks/use-wallet-connection.ts`:

```typescript
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useAnchorProgram } from './use-anchor-program';

export function useWalletConnection() {
	const { connection } = useConnection();
	const wallet = useWallet();
	const { program, provider, ready } = useAnchorProgram();

	return {
		connection,
		wallet: wallet.wallet?.adapter ?? null,
		publicKey: wallet.publicKey,
		connected: wallet.connected,
		connecting: wallet.connecting,
		program,
		provider,
		ready,
		// Transaction helpers
		sendTransaction: wallet.sendTransaction,
		signTransaction: wallet.signTransaction,
		signAllTransactions: wallet.signAllTransactions
	};
}
```

> **Note:** We removed the Metaplex instance - NFTs are fetched via Helius API instead!

---

## Step 4: Add Providers to Root Layout

Update `src/app/layout.tsx`:

```typescript
import { Inter } from 'next/font/google';
import { SolanaWalletProvider } from '@/providers/wallet-provider';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { Toaster } from 'sonner';
import '@/lib/polyfills';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
	title: 'DAOVote',
	description: 'DAO Voting Platform'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={inter.className}>
				<QueryProvider>
					<SolanaWalletProvider>
						<ThemeProvider>
							{children}
							<Toaster position="bottom-right" />
						</ThemeProvider>
					</SolanaWalletProvider>
				</QueryProvider>
			</body>
		</html>
	);
}
```

---

## Step 5: Theme Provider (for DaisyUI)

Create `src/providers/theme-provider.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/stores/theme-store';

interface Props {
	children: React.ReactNode;
}

export function ThemeProvider({ children }: Props) {
	const { isDark, setTheme } = useThemeStore();

	// Initialize theme on mount
	useEffect(() => {
		const theme = isDark ? 'monkedao_dark' : 'monkedao';
		document.documentElement.setAttribute('data-theme', theme);
	}, [isDark]);

	return <>{children}</>;
}
```

---

## Step 6: Wallet UI Components

### Wallet Connect Button

Create `src/components/wallet/wallet-button.tsx`:

```typescript
'use client';

import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues
const WalletMultiButtonDynamic = dynamic(
	async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
	{ ssr: false }
);

export function WalletButton() {
	return <WalletMultiButtonDynamic />;
}
```

### Custom Wallet Display

Create `src/components/wallet/wallet-display.tsx`:

```typescript
'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useSOLBalance } from '@/lib/hooks/use-balance';

export function WalletDisplay() {
	const { publicKey, connected } = useWallet();
	const { data: balance, isLoading } = useSOLBalance();

	if (!connected || !publicKey) {
		return null;
	}

	const shortAddress = `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`;

	return (
		<div className="flex items-center gap-2">
			<span className="text-sm">{shortAddress}</span>
			{!isLoading && balance !== undefined && (
				<span className="text-sm text-gray-500">{balance.toFixed(2)} SOL</span>
			)}
		</div>
	);
}
```

---

## Usage Comparison

### Before (Svelte)

```svelte
<script>
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace } from '@svelte-on-solana/wallet-adapter-anchor';
	import { walletProgramConnection } from '$lib/wallet';

	const walletConnectionFactory = walletProgramConnection(walletStore, workSpace);

	let ready: boolean;
	let connection;
	let program;
	let currentUser;

	$: {
		ready = $walletConnectionFactory.ready;
		if (ready && $walletConnectionFactory.connection) {
			connection = $walletConnectionFactory.connection;
		}
		if (ready && $walletConnectionFactory.program) {
			program = $walletConnectionFactory.program;
		}
		if (ready && $walletConnectionFactory.publicKey) {
			currentUser = $walletConnectionFactory.publicKey;
		}
	}

	// Send transaction
	const tx = new Transaction().add(ix);
	const signature = await $walletStore.sendTransaction(tx, connection);
</script>
```

### After (React)

```tsx
import { useWalletConnection } from '@/lib/hooks/use-wallet-connection';

function MyComponent() {
  const {
    connection,
    program,
    publicKey,
    ready,
    sendTransaction
  } = useWalletConnection();

  // Much cleaner - no reactive statements needed
  if (!ready) return <Loading />;

  // Send transaction
  const handleSubmit = async () => {
    const tx = new Transaction().add(ix);
    const signature = await sendTransaction(tx, connection);
  };

  return (
    // ...
  );
}
```

---

## Transaction Helper

Create `src/lib/utils/transaction.ts`:

```typescript
import { Connection, Transaction, TransactionSignature } from '@solana/web3.js';
import { useUIStore } from '@/lib/stores/ui-store';

interface SendTransactionOptions {
	connection: Connection;
	transaction: Transaction;
	sendTransaction: (tx: Transaction, connection: Connection) => Promise<TransactionSignature>;
}

export async function sendAndConfirmTransaction({
	connection,
	transaction,
	sendTransaction
}: SendTransactionOptions): Promise<TransactionSignature> {
	const { setMessage, setLoading, reset } = useUIStore.getState();

	try {
		setLoading(true);

		// Simulate first
		setMessage('Simulating transaction...');
		const simulation = await connection.simulateTransaction(transaction);
		if (simulation.value.err) {
			throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
		}

		// Send
		setMessage('Waiting for signature...');
		const signature = await sendTransaction(transaction, connection);

		// Confirm
		setMessage('Confirming transaction...');
		const latestBlockhash = await connection.getLatestBlockhash();
		await connection.confirmTransaction(
			{
				signature,
				blockhash: latestBlockhash.blockhash,
				lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
			},
			'confirmed'
		);

		setMessage('Success!');
		return signature;
	} finally {
		setTimeout(() => reset(), 2000);
	}
}
```

---

## Checklist

- [ ] Install wallet adapter packages
- [ ] Create SolanaWalletProvider
- [ ] Create useAnchorProgram hook
- [ ] Create useWalletConnection hook
- [ ] Create ThemeProvider
- [ ] Update root layout with providers
- [ ] Create WalletButton component
- [ ] Create WalletDisplay component
- [ ] Create transaction helper utility
- [ ] Test wallet connection on test page

---

## Next Steps

→ [04-API-ROUTES.md](./04-API-ROUTES.md) - Convert SvelteKit API routes to Next.js
