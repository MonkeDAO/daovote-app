# 09 - Testing & Deployment

## Overview

This document covers testing strategy, CI/CD setup, and Vercel deployment for the migrated Next.js application.

---

## Testing Strategy

### Testing Layers

| Layer               | Tool                  | Purpose                              |
| ------------------- | --------------------- | ------------------------------------ |
| **Unit Tests**      | Vitest                | Test utility functions, hooks        |
| **Component Tests** | React Testing Library | Test component rendering & behavior  |
| **Integration**     | Vitest + MSW          | Test API routes with mocked services |
| **E2E Tests**       | Playwright            | Full user flow testing               |

### What to Test

**High Priority:**

- Wallet connection/disconnection
- Voting flow (select NFTs -> cast vote -> confirm)
- Proposal creation with file upload
- Delegation flow

**Medium Priority:**

- API routes (data fetching, error handling)
- State management (stores)
- Form validation

**Lower Priority:**

- Static UI components
- Styling/visual regression

---

## Setup Testing Framework

### 1. Install Dependencies

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
npm install -D msw
npm install -D @playwright/test
```

### 2. Vitest Configuration

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
	plugins: [react()],
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/test/setup.ts'],
		include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
		exclude: ['node_modules', 'e2e'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules', 'src/test', '**/*.d.ts', '**/*.config.*', '**/types/*']
		}
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src')
		}
	}
});
```

### 3. Test Setup File

Create `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// Start MSW server before tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Clean up after each test
afterEach(() => {
	cleanup();
	server.resetHandlers();
});

// Close server after all tests
afterAll(() => server.close());

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => {}
	})
});
```

### 4. MSW Setup for API Mocking

Create `src/test/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
	// Mock fetch proposals
	http.get('/api/proposals', () => {
		return HttpResponse.json({
			proposals: [
				{
					pubkey: 'proposal1',
					account: {
						title: 'Test Proposal',
						description: 'Test description',
						status: 'active',
						yesVotes: 100,
						noVotes: 50,
						abstainVotes: 10
					}
				}
			]
		});
	}),

	// Mock fetch NFTs
	http.get('/api/fetchNftsV2', ({ request }) => {
		const url = new URL(request.url);
		const owner = url.searchParams.get('owner');

		return HttpResponse.json({
			items: [
				{
					id: 'nft1',
					content: {
						metadata: { name: 'Test NFT #1' }
					},
					grouping: [{ group_value: 'collection1' }]
				}
			]
		});
	}),

	// Mock file upload
	http.post('/api/upload', async () => {
		return HttpResponse.json({
			url: 'https://example.com/uploaded-file.pdf',
			filename: 'uploaded-file.pdf'
		});
	})
];
```

Create `src/test/mocks/server.ts`:

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

---

## Unit Tests Examples

### Testing Utility Functions

Create `src/lib/utils/__tests__/date.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { formatDate, isExpired, getTimeRemaining } from '../date';

describe('date utilities', () => {
	it('formats date correctly', () => {
		const date = new Date('2024-01-15T12:00:00Z');
		expect(formatDate(date)).toBe('Jan 15, 2024');
	});

	it('detects expired dates', () => {
		const pastDate = new Date(Date.now() - 86400000);
		const futureDate = new Date(Date.now() + 86400000);

		expect(isExpired(pastDate)).toBe(true);
		expect(isExpired(futureDate)).toBe(false);
	});

	it('calculates time remaining', () => {
		const futureDate = new Date(Date.now() + 3600000); // 1 hour
		const result = getTimeRemaining(futureDate);

		expect(result.hours).toBe(0);
		expect(result.minutes).toBeGreaterThanOrEqual(59);
	});
});
```

### Testing Zustand Stores

Create `src/lib/stores/__tests__/theme-store.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from '../theme-store';

describe('theme store', () => {
	beforeEach(() => {
		// Reset store state
		useThemeStore.setState({ theme: 'monkedao' });
	});

	it('initializes with light theme', () => {
		const { theme } = useThemeStore.getState();
		expect(theme).toBe('monkedao');
	});

	it('toggles theme', () => {
		const { toggleTheme } = useThemeStore.getState();

		toggleTheme();
		expect(useThemeStore.getState().theme).toBe('monkedao_dark');

		toggleTheme();
		expect(useThemeStore.getState().theme).toBe('monkedao');
	});

	it('sets theme directly', () => {
		const { setTheme } = useThemeStore.getState();

		setTheme('monkedao_dark');
		expect(useThemeStore.getState().theme).toBe('monkedao_dark');
	});
});
```

### Testing React Query Hooks

Create `src/lib/hooks/__tests__/use-proposals.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProposals } from '../use-proposals';

const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false }
		}
	});

	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

describe('useProposals', () => {
	it('fetches proposals successfully', async () => {
		const { result } = renderHook(() => useProposals('votebank-address'), {
			wrapper: createWrapper()
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.proposals).toHaveLength(1);
		expect(result.current.data?.proposals[0].account.title).toBe('Test Proposal');
	});
});
```

---

## Component Tests Examples

### Testing a Component

Create `src/components/__tests__/ProposalCard.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProposalCard } from '../ProposalCard';

const mockProposal = {
	pubkey: 'proposal1',
	account: {
		title: 'Test Proposal',
		description: 'This is a test proposal',
		status: 'active',
		yesVotes: 100,
		noVotes: 50,
		abstainVotes: 10,
		endTime: new Date(Date.now() + 86400000).toISOString()
	}
};

describe('ProposalCard', () => {
	it('renders proposal title and description', () => {
		render(<ProposalCard proposal={mockProposal} />);

		expect(screen.getByText('Test Proposal')).toBeInTheDocument();
		expect(screen.getByText('This is a test proposal')).toBeInTheDocument();
	});

	it('shows active badge for active proposals', () => {
		render(<ProposalCard proposal={mockProposal} />);

		expect(screen.getByText('Active')).toBeInTheDocument();
	});

	it('displays vote counts', () => {
		render(<ProposalCard proposal={mockProposal} />);

		expect(screen.getByText('100')).toBeInTheDocument(); // Yes votes
		expect(screen.getByText('50')).toBeInTheDocument(); // No votes
	});

	it('calls onClick when clicked', () => {
		const handleClick = vi.fn();
		render(<ProposalCard proposal={mockProposal} onClick={handleClick} />);

		fireEvent.click(screen.getByRole('article'));
		expect(handleClick).toHaveBeenCalledWith('proposal1');
	});
});
```

### Testing with Wallet Context

Create `src/test/utils/test-providers.tsx`:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletContextState } from '@solana/wallet-adapter-react';

const mockWallet: Partial<WalletContextState> = {
	connected: false,
	connecting: false,
	disconnecting: false,
	publicKey: null,
	wallet: null,
	wallets: [],
	connect: vi.fn(),
	disconnect: vi.fn(),
	select: vi.fn(),
	sendTransaction: vi.fn(),
	signTransaction: vi.fn(),
	signAllTransactions: vi.fn(),
	signMessage: vi.fn()
};

export const MockWalletContext = React.createContext<WalletContextState>(
	mockWallet as WalletContextState
);

export function TestProviders({ children }: { children: React.ReactNode }) {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false }
		}
	});

	return (
		<QueryClientProvider client={queryClient}>
			<MockWalletContext.Provider value={mockWallet as WalletContextState}>
				{children}
			</MockWalletContext.Provider>
		</QueryClientProvider>
	);
}
```

---

## E2E Tests with Playwright

### Playwright Configuration

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'html',
	use: {
		baseURL: 'http://localhost:3000',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'Mobile Safari',
			use: { ...devices['iPhone 13'] }
		}
	],
	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:3000',
		reuseExistingServer: !process.env.CI
	}
});
```

### E2E Test Example

Create `e2e/proposals.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Proposals Page', () => {
	test('displays list of proposals', async ({ page }) => {
		await page.goto('/votebank/test-address');

		// Wait for proposals to load
		await expect(page.getByRole('heading', { name: /Proposals/i })).toBeVisible();

		// Check that proposal cards are displayed
		const proposalCards = page.locator('[data-testid="proposal-card"]');
		await expect(proposalCards.first()).toBeVisible();
	});

	test('opens proposal detail on click', async ({ page }) => {
		await page.goto('/votebank/test-address');

		// Click on first proposal
		await page.locator('[data-testid="proposal-card"]').first().click();

		// Should navigate to proposal detail
		await expect(page).toHaveURL(/\/proposal\//);
	});
});

test.describe('Wallet Connection', () => {
	test('shows connect wallet button when disconnected', async ({ page }) => {
		await page.goto('/');

		await expect(page.getByRole('button', { name: /connect wallet/i })).toBeVisible();
	});
});
```

---

## Package.json Scripts

Add these scripts to `package.json`:

```json
{
	"scripts": {
		"dev": "next dev",
		"build": "next build",
		"start": "next start",
		"lint": "next lint",
		"type-check": "tsc --noEmit",
		"test": "vitest",
		"test:run": "vitest run",
		"test:coverage": "vitest run --coverage",
		"test:ui": "vitest --ui",
		"test:e2e": "playwright test",
		"test:e2e:ui": "playwright test --ui",
		"test:all": "npm run test:run && npm run test:e2e"
	}
}
```

---

## Vercel Deployment

### 1. Environment Variables

Set these in Vercel dashboard or `.env.local`:

```bash
# Required
NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_HELIUS_API_KEY=your-helius-api-key

# Optional - for file uploads
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
# or
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=daovote-uploads
R2_PUBLIC_URL=https://your-public-bucket-url.com
```

### 2. Vercel Configuration

Create `vercel.json`:

```json
{
	"framework": "nextjs",
	"buildCommand": "npm run build",
	"outputDirectory": ".next",
	"installCommand": "npm install",
	"headers": [
		{
			"source": "/api/(.*)",
			"headers": [
				{ "key": "Access-Control-Allow-Origin", "value": "*" },
				{ "key": "Access-Control-Allow-Methods", "value": "GET, POST, OPTIONS" },
				{ "key": "Access-Control-Allow-Headers", "value": "Content-Type" }
			]
		}
	],
	"rewrites": []
}
```

### 3. Deploy Steps

**Option A: Connect Git Repository**

1. Push code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com) and import project
3. Select the repository
4. Configure:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Add environment variables
6. Deploy

**Option B: Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy preview
vercel

# Deploy production
vercel --prod
```

### 4. CI/CD with GitHub Actions

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Unit tests
        run: npm run test:run

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: E2E tests
        run: npm run test:e2e
        env:
          NEXT_PUBLIC_RPC_URL: ${{ secrets.NEXT_PUBLIC_RPC_URL }}
          NEXT_PUBLIC_HELIUS_API_KEY: ${{ secrets.NEXT_PUBLIC_HELIUS_API_KEY }}

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 5. Vercel GitHub Secrets

Add these secrets to your GitHub repository:

- `VERCEL_TOKEN` - From Vercel account settings
- `VERCEL_ORG_ID` - From `.vercel/project.json` after `vercel link`
- `VERCEL_PROJECT_ID` - From `.vercel/project.json` after `vercel link`
- `NEXT_PUBLIC_RPC_URL` - Solana RPC URL
- `NEXT_PUBLIC_HELIUS_API_KEY` - Helius API key

---

## Performance Monitoring

### Vercel Analytics

```bash
npm install @vercel/analytics
```

In `src/app/layout.tsx`:

```tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body>
				{children}
				<Analytics />
			</body>
		</html>
	);
}
```

### Vercel Speed Insights

```bash
npm install @vercel/speed-insights
```

```tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body>
				{children}
				<SpeedInsights />
			</body>
		</html>
	);
}
```

---

## Deployment Checklist

### Pre-deployment

- [ ] All tests passing (`npm run test:run`)
- [ ] Type check passing (`npm run type-check`)
- [ ] Lint passing (`npm run lint`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] E2E tests passing (`npm run test:e2e`)

### Environment

- [ ] All environment variables set in Vercel
- [ ] RPC endpoint is production-ready (not rate-limited)
- [ ] Helius API key has sufficient quota
- [ ] Storage bucket configured (Vercel Blob/R2)

### Post-deployment

- [ ] Verify homepage loads
- [ ] Verify wallet connection works
- [ ] Verify proposal listing works
- [ ] Verify voting flow works
- [ ] Verify delegation flow works
- [ ] Check Vercel Analytics for errors
- [ ] Test on mobile devices

---

## Rollback Strategy

If issues are found after deployment:

1. **Instant Rollback** in Vercel Dashboard:

   - Go to Deployments
   - Find last working deployment
   - Click "..." -> "Promote to Production"

2. **Git Revert**:

   ```bash
   git revert HEAD
   git push origin main
   # Vercel will auto-deploy the revert
   ```

3. **Feature Flags** (for gradual rollouts):
   - Use environment variables to toggle features
   - `NEXT_PUBLIC_FEATURE_NEW_VOTING=false`

---

## Summary

| Stage      | Tools          | Command              |
| ---------- | -------------- | -------------------- |
| Unit Tests | Vitest         | `npm run test`       |
| E2E Tests  | Playwright     | `npm run test:e2e`   |
| Type Check | TypeScript     | `npm run type-check` |
| Lint       | ESLint         | `npm run lint`       |
| Build      | Next.js        | `npm run build`      |
| Deploy     | Vercel         | `vercel --prod`      |
| CI/CD      | GitHub Actions | Auto on push         |

---

## Migration Complete!

You've completed the migration documentation. Here's what to do next:

1. **Review all docs** in `docs/migration/`
2. **Set up the Next.js project** following `01-PROJECT-SETUP.md`
3. **Migrate incrementally** - start with API routes, then pages
4. **Test continuously** - run tests after each migration step
5. **Deploy to preview** - use Vercel preview deployments for testing
6. **Deploy to production** - when all features verified

Good luck with the migration!
