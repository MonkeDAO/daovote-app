# DAOVote Migration: SvelteKit to Next.js

## Overview

This document set provides a comprehensive guide for migrating the DAOVote application from SvelteKit to Next.js with React.

## Document Index

| Document                                               | Description                                                |
| ------------------------------------------------------ | ---------------------------------------------------------- |
| [00-OVERVIEW.md](./00-OVERVIEW.md)                     | This file - migration overview and strategy                |
| [01-PROJECT-SETUP.md](./01-PROJECT-SETUP.md)           | Next.js project setup, dependencies, configuration         |
| [02-STATE-MANAGEMENT.md](./02-STATE-MANAGEMENT.md)     | Converting Svelte stores to Zustand/React Query            |
| [03-WALLET-INTEGRATION.md](./03-WALLET-INTEGRATION.md) | Solana wallet adapter setup for React                      |
| [04-API-ROUTES.md](./04-API-ROUTES.md)                 | Converting SvelteKit API routes to Next.js                 |
| [05-PAGES-ROUTING.md](./05-PAGES-ROUTING.md)           | Page migration and data fetching patterns                  |
| [06-COMPONENTS.md](./06-COMPONENTS.md)                 | Component-by-component migration guide                     |
| [07-STORAGE-UPLOAD.md](./07-STORAGE-UPLOAD.md)         | Storage & file upload migration (Shadow Drive replacement) |
| [08-UI-STYLING.md](./08-UI-STYLING.md)                 | Tailwind, DaisyUI, shadcn/ui setup                         |
| [09-TESTING-DEPLOYMENT.md](./09-TESTING-DEPLOYMENT.md) | Testing strategy and Vercel deployment                     |

---

## Migration Strategy

### Phase 1: Foundation (Week 1)

- [ ] Set up Next.js 14+ project with App Router
- [ ] Configure Tailwind CSS + DaisyUI + shadcn/ui
- [ ] Set up Solana wallet adapter for React
- [ ] Configure environment variables
- [ ] Copy over Anchor code (unchanged)
- [ ] Set up Zustand stores and React Query

### Phase 2: API & Data Layer (Week 1-2)

- [ ] Migrate all API routes
- [ ] Set up React Query hooks for data fetching
- [ ] Test API endpoints

### Phase 3: Core Pages (Week 2)

- [ ] Home page (proposal listing)
- [ ] Votebank pages
- [ ] Proposal view page (most complex)
- [ ] Proposal creation page

### Phase 4: Delegation Feature (Week 2-3)

- [ ] Delegate create page
- [ ] Delegate sign page
- [ ] Delegate manage page

### Phase 5: Components (Week 3)

- [ ] Navigation and layout
- [ ] Modals and overlays
- [ ] NFT grid and selection
- [ ] Charts and progress indicators

### Phase 6: Polish & Deploy (Week 3-4)

- [ ] Testing
- [ ] Performance optimization
- [ ] Vercel deployment
- [ ] DNS/domain setup

---

## Architecture Comparison

### SvelteKit Architecture

```
src/
├── routes/
│   ├── +layout.svelte          # Root layout with providers
│   ├── +page.svelte            # Home page
│   ├── +page.ts                # Page loader
│   ├── api/                    # API routes (+server.ts)
│   ├── votebank/[address]/     # Dynamic routes
│   └── delegate/               # Delegation feature
├── lib/
│   ├── components/             # Svelte components
│   ├── stores/                 # Svelte stores
│   ├── anchor/                 # Solana/Anchor code
│   └── utils/                  # Utility functions
```

### Next.js Architecture (Target)

```
src/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Home page
│   ├── api/                    # API routes (route.ts)
│   ├── votebank/[address]/     # Dynamic routes
│   └── delegate/               # Delegation feature
├── components/
│   ├── ui/                     # shadcn/ui components
│   └── ...                     # Feature components
├── lib/
│   ├── stores/                 # Zustand stores
│   ├── hooks/                  # React Query hooks
│   ├── anchor/                 # Solana/Anchor code (UNCHANGED)
│   └── utils/                  # Utility functions (mostly unchanged)
├── providers/
│   └── ...                     # Context providers
```

---

## Key Technology Mappings

| SvelteKit               | Next.js                        |
| ----------------------- | ------------------------------ |
| `+page.svelte`          | `page.tsx`                     |
| `+page.ts` (load)       | Server Component / React Query |
| `+server.ts`            | `route.ts`                     |
| `+layout.svelte`        | `layout.tsx`                   |
| `$:` reactive           | `useMemo` / computed inline    |
| `writable()` store      | Zustand store                  |
| `derived()` store       | Zustand selector / `useMemo`   |
| `bind:value`            | `useState` + `onChange`        |
| `on:click`              | `onClick`                      |
| `{#if}` / `{:else}`     | Ternary / `&&` / early return  |
| `{#each}`               | `.map()`                       |
| `<slot>`                | `children` prop                |
| `createEventDispatcher` | Callback props                 |
| `@svelte-on-solana/*`   | `@solana/wallet-adapter-react` |

---

## Files That Stay (Almost) Unchanged

These files are framework-agnostic and can be copied directly:

### Anchor Code (100% reusable)

- `src/lib/anchor/accounts/*` - All account types
- `src/lib/anchor/instructions/*` - All instructions
- `src/lib/anchor/types/*` - All types
- `src/lib/anchor/errors/*` - Error handling
- `src/lib/anchor/omcvote/omcvote.json` - IDL

### Utility Functions (95% reusable)

- `src/lib/utils/solana.ts` - Core Solana utilities
- `src/lib/utils/votehelpers.ts` - Vote instruction builders
- `src/lib/utils/proposal.ts` - Proposal helpers
- `src/lib/utils/date.ts` - Date utilities
- `src/lib/utils/retry.ts` - Retry logic
- `src/lib/utils/cache.ts` - Caching (may need adjustment)

### Types (100% reusable)

- `src/lib/types.d.ts` - All TypeScript types

### Configuration

- `tailwind.config.js` - Tailwind config (minor adjustments)
- Theme colors and DaisyUI config

---

## Estimated Effort by Component

| Component/Area            | Complexity | Estimated Hours  |
| ------------------------- | ---------- | ---------------- |
| Project Setup             | Low        | 4-6              |
| Wallet Integration        | Medium     | 6-8              |
| State Management (Stores) | High       | 12-16            |
| API Routes (8 routes)     | Low        | 4-6              |
| Home Page                 | Medium     | 4-6              |
| Votebank Pages            | Medium     | 6-8              |
| Proposal View Page        | High       | 12-16            |
| Proposal Create Page      | High       | 10-12            |
| Delegate Pages (3)        | Medium     | 8-10             |
| Nav/Layout                | Medium     | 4-6              |
| Modals/Overlays           | Low        | 4-6              |
| NFT Grid                  | Medium     | 6-8              |
| Charts/Progress           | Low        | 4-6              |
| Testing                   | Medium     | 8-12             |
| **Total**                 |            | **90-120 hours** |

---

## Risk Areas

### High Risk

1. **Wallet Connection State** - The reactive wallet state synchronization is complex
2. **Proposal Voting Flow** - Multiple transactions, NFT selection, delegation
3. **Real-time Updates** - Streaming data patterns need careful handling

### Medium Risk

1. **Shadow Drive Integration** - File uploads during proposal creation
2. **Chart.js Integration** - Different React wrapper
3. **TipTap Editor** - Different React integration

### Low Risk

1. **API Routes** - Almost 1:1 mapping
2. **Styling** - Tailwind works identically
3. **Anchor Code** - No changes needed

---

## Success Criteria

- [ ] All existing functionality works identically
- [ ] Wallet connection/disconnection works reliably
- [ ] Voting flow completes successfully
- [ ] Delegation flow completes successfully
- [ ] Proposal creation with file upload works
- [ ] Mobile responsive design maintained
- [ ] Dark mode toggle works
- [ ] Performance equal or better than SvelteKit version
- [ ] Successful Vercel deployment
