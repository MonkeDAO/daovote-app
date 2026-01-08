# 08 - UI & Styling Migration

## Overview

This document covers migrating the styling setup from SvelteKit to Next.js, including Tailwind CSS, DaisyUI, custom themes, and optionally adding shadcn/ui components.

---

## Current Styling Stack

The SvelteKit app uses:

- **Tailwind CSS** - Utility-first CSS framework
- **DaisyUI** - Component library built on Tailwind
- **Custom DaisyUI Themes** - `monkedao` (light) and `monkedao_dark` (dark)
- **@tailwindcss/typography** - Prose styling for rich content
- **Space Grotesk** - Primary font
- **Fira Mono** - Monospace font

---

## Next.js Setup

### 1. Install Dependencies

```bash
npm install tailwindcss postcss autoprefixer daisyui @tailwindcss/typography
npm install @fontsource/space-grotesk @fontsource/fira-mono
npx tailwindcss init -p
```

### 2. Tailwind Configuration

Create `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
	content: [
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}'
	],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				brand: {
					dark: '#184623',
					DEFAULT: '#4A8F5D',
					light: '#86C994'
				},
				secondary: {
					dark: '#0033A1',
					DEFAULT: '#2F8DCC',
					light: '#90C6EA'
				},
				accent: {
					white: '#FFFFFF',
					light: '#F3EFCD',
					DEFAULT: '#FFC919'
				}
			},
			fontFamily: {
				sans: ['var(--font-space-grotesk)', 'Arial', 'sans-serif'],
				mono: ['var(--font-fira-mono)', 'monospace']
			},
			typography: (theme: (path: string) => string) => ({
				DEFAULT: {
					css: {
						'--tw-prose-bullets': theme('colors.black'),
						blockquote: {
							borderLeft: '3px solid red',
							fontSize: 'inherit',
							fontStyle: 'inherit',
							fontWeight: 'medium'
						},
						'blockquote p:first-of-type::before': {
							content: ''
						},
						'blockquote p:last-of-type::after': {
							content: ''
						},
						'code::before': 'none',
						'code::after': 'none',
						code: {
							borderRadius: '0.25rem',
							padding: '0.15rem 0.3rem',
							borderWidth: '2px',
							borderColor: 'rgba(0,0,0,0.1)'
						},
						pre: {
							borderRadius: '0rem'
						},
						'a:hover': {
							color: '#31cdce !important',
							textDecoration: 'underline !important'
						},
						a: {
							color: '#2071ad',
							textDecoration: 'none'
						},
						'a code': {
							color: 'unset'
						},
						table: {
							overflow: 'hidden'
						},
						'li, ul, ol': {
							margin: 0
						},
						'li > img': {
							margin: 0,
							display: 'inline'
						},
						'ol > li::marker': {
							color: 'var(--tw-prose-body)'
						},
						'ul > li::marker': {
							color: 'var(--tw-prose-body)'
						},
						'ul > li > p': {
							marginTop: 0,
							marginBottom: 0
						}
					}
				}
			})
		}
	},
	daisyui: {
		themes: [
			{
				monkedao: {
					primary: '#4A8F5D',
					'primary-focus': '#184623',
					'primary-content': '#FFFFFF',
					secondary: '#2F8DCC',
					'secondary-focus': '#0033A1',
					'secondary-content': '#FFFFFF',
					accent: '#FFC919',
					'accent-focus': '#F3EFCD',
					'accent-content': '#184623',
					neutral: '#184623',
					'neutral-focus': '#4A8F5D',
					'neutral-content': '#F3EFCD',
					'base-100': '#FFFFFF',
					'base-200': '#F3EFCD',
					'base-300': '#86C994',
					'base-content': '#184623'
				},
				monkedao_dark: {
					primary: '#4A8F5D',
					'primary-focus': '#86C994',
					'primary-content': '#F3EFCD',
					secondary: '#2F8DCC',
					'secondary-focus': '#90C6EA',
					'secondary-content': '#F3EFCD',
					accent: '#FFC919',
					'accent-focus': '#F3EFCD',
					'accent-content': '#184623',
					neutral: '#F3EFCD',
					'neutral-focus': '#FFFFFF',
					'neutral-content': '#184623',
					'base-100': '#184623',
					'base-200': '#4A8F5D',
					'base-300': '#86C994',
					'base-content': '#F3EFCD'
				}
			}
		],
		darkTheme: 'monkedao_dark'
	},
	plugins: [require('@tailwindcss/typography'), require('daisyui')]
};

export default config;
```

### 3. Global CSS

Create `src/app/globals.css`:

```css
@import '@fontsource/space-grotesk/400.css';
@import '@fontsource/space-grotesk/500.css';
@import '@fontsource/space-grotesk/700.css';
@import '@fontsource/fira-mono';

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
	--font-body: 'Space Grotesk', Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
		Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
	--font-mono: 'Fira Mono', monospace;
	font-family: var(--font-body);
}

html {
	@apply bg-base-100;
}

html.dark {
	@apply bg-base-100;
}

/* Wallet adapter button styling */
.wallet-adapter-button-trigger {
	@apply bg-secondary text-secondary-content hover:bg-secondary-focus !important;
}

html.dark .wallet-adapter-button-trigger {
	@apply bg-accent text-accent-content hover:bg-accent-focus !important;
}

body {
	min-height: 100vh;
	margin: 0;
	@apply bg-base-100;
	--scrollbar-primary-color: var(--p);
	--text-color: var(--er);
	overflow: scroll;
}

body::-webkit-scrollbar {
	width: 0.5rem;
}

body::-webkit-scrollbar-thumb {
	background: linear-gradient(to right, var(--p), var(--s), var(--a));
	border-radius: 4px;
}

pre {
	font-size: 16px;
	font-family: var(--font-mono);
	background-color: rgba(255, 255, 255, 0.45);
	border-radius: 3px;
	box-shadow: 2px 2px 6px rgb(255 255 255 / 25%);
	padding: 0.5em;
	overflow-x: auto;
}

@layer components {
	body {
		--brand-accent: #facc15;
		overflow-wrap: break-word;
		overflow-y: auto;
		scrollbar-gutter: stable;
	}

	:root {
		accent-color: var(--brand-accent);
	}

	:focus-visible {
		outline-color: var(--brand-accent);
	}

	::selection {
		background-color: var(--p);
		color: var(--pc);
	}

	.dark ::selection {
		color: var(--bc);
	}

	::marker {
		color: var(--brand-accent);
	}

	:is(
			::-webkit-calendar-picker-indicator,
			::-webkit-clear-button,
			::-webkit-inner-spin-button,
			::-webkit-outer-spin-button
		) {
		color: var(--brand-accent);
	}

	details {
		border: 2px solid var(--brand-accent);
		padding: 0.5rem 1rem;
	}

	details > summary {
		cursor: pointer;
	}

	details > summary > *:first-child {
		display: inline;
	}

	img {
		max-width: 100%;
		object-fit: cover;
		background-color: grey;
	}
}

a {
	@apply text-accent hover:text-primary-focus hover:underline;
}

article.prose a {
	word-break: break-word;
}

article.prose h1 a,
h2 a,
h3 a,
h4 a,
h5 a,
h6 a {
	text-decoration: none !important;
	@apply text-primary dark:text-accent;
}

.capsize::before {
	content: '';
	margin-bottom: -0.098em;
	display: table;
}

.capsize::after {
	content: '';
	margin-top: -0.219em;
	display: table;
}

.wallet-adapter-button-start-icon img {
	background-color: transparent !important;
}
```

### 4. Font Setup with Next.js

In `src/app/layout.tsx`, use Next.js font optimization:

```tsx
import { Space_Grotesk, Fira_Mono } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
	subsets: ['latin'],
	variable: '--font-space-grotesk'
});

const firaMono = Fira_Mono({
	weight: ['400', '500', '700'],
	subsets: ['latin'],
	variable: '--font-fira-mono'
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html
			lang="en"
			className={`${spaceGrotesk.variable} ${firaMono.variable}`}
			data-theme="monkedao"
		>
			<body className="font-sans">{children}</body>
		</html>
	);
}
```

---

## Dark Mode Implementation

### Theme Toggle Store

Create `src/lib/stores/theme-store.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'monkedao' | 'monkedao_dark';

interface ThemeState {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
	persist(
		(set, get) => ({
			theme: 'monkedao',
			setTheme: (theme) => set({ theme }),
			toggleTheme: () =>
				set({
					theme: get().theme === 'monkedao' ? 'monkedao_dark' : 'monkedao'
				})
		}),
		{
			name: 'daovote-theme'
		}
	)
);
```

### Theme Provider

Create `src/providers/theme-provider.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/stores/theme-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const { theme } = useThemeStore();

	useEffect(() => {
		// Update data-theme attribute
		document.documentElement.setAttribute('data-theme', theme);

		// Update dark class for Tailwind dark: variants
		if (theme === 'monkedao_dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}, [theme]);

	return <>{children}</>;
}
```

### Theme Toggle Component

Create `src/components/theme-toggle.tsx`:

```tsx
'use client';

import { useThemeStore } from '@/lib/stores/theme-store';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
	const { theme, toggleTheme } = useThemeStore();

	return (
		<button onClick={toggleTheme} className="btn btn-circle btn-ghost" aria-label="Toggle theme">
			{theme === 'monkedao_dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
		</button>
	);
}
```

---

## Optional: Adding shadcn/ui

shadcn/ui provides high-quality, accessible components that work well alongside DaisyUI.

### Setup

```bash
npx shadcn-ui@latest init
```

Configuration options:

```
Would you like to use TypeScript (recommended)? yes
Which style would you like to use? Default
Which color would you like to use as base color? Neutral
Where is your global CSS file? src/app/globals.css
Do you want to use CSS variables for colors? yes
Where is your tailwind.config.ts located? tailwind.config.ts
Configure the import alias for components: @/components
Configure the import alias for utils: @/lib/utils
Are you using React Server Components? yes
```

### Install Components As Needed

```bash
# Examples - only install what you need
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add tooltip
```

### Using shadcn/ui with DaisyUI

You can use both libraries together:

- **DaisyUI** - For themed components (cards, navbars, etc.)
- **shadcn/ui** - For complex interactive components (dialogs, dropdowns, command palette)

```tsx
// Using DaisyUI card with shadcn/ui dialog
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

export function ProposalCard({ proposal }) {
	return (
		<div className="card bg-base-100 shadow-xl">
			{/* DaisyUI card */}
			<div className="card-body">
				<h2 className="card-title">{proposal.title}</h2>
				<div className="card-actions justify-end">
					<Dialog>
						{/* shadcn/ui dialog */}
						<DialogTrigger asChild>
							<button className="btn btn-primary">View Details</button>
						</DialogTrigger>
						<DialogContent>{/* Dialog content */}</DialogContent>
					</Dialog>
				</div>
			</div>
		</div>
	);
}
```

---

## Component Styling Patterns

### DaisyUI Classes (Most Common)

```tsx
// Buttons
<button className="btn">Default</button>
<button className="btn btn-primary">Primary</button>
<button className="btn btn-secondary">Secondary</button>
<button className="btn btn-accent">Accent</button>
<button className="btn btn-ghost">Ghost</button>
<button className="btn btn-outline">Outline</button>

// Cards
<div className="card bg-base-100 shadow-xl">
  <div className="card-body">
    <h2 className="card-title">Title</h2>
    <p>Content</p>
    <div className="card-actions justify-end">
      <button className="btn btn-primary">Action</button>
    </div>
  </div>
</div>

// Badges
<span className="badge">Default</span>
<span className="badge badge-primary">Primary</span>
<span className="badge badge-success">Success</span>
<span className="badge badge-error">Error</span>

// Alerts
<div className="alert alert-info">Info message</div>
<div className="alert alert-success">Success message</div>
<div className="alert alert-warning">Warning message</div>
<div className="alert alert-error">Error message</div>

// Loading states
<span className="loading loading-spinner loading-lg"></span>
<span className="loading loading-dots loading-md"></span>

// Form inputs
<input type="text" className="input input-bordered w-full" />
<select className="select select-bordered w-full">
  <option>Option 1</option>
</select>
<textarea className="textarea textarea-bordered w-full"></textarea>

// Progress
<progress className="progress progress-primary w-full" value={70} max={100}></progress>
```

### Responsive Patterns

```tsx
// Grid layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>

// Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Title</h1>

// Responsive padding
<div className="p-4 md:p-6 lg:p-8">Content</div>

// Hide/show on breakpoints
<div className="hidden md:block">Desktop only</div>
<div className="block md:hidden">Mobile only</div>
```

### Dark Mode Variants

```tsx
// Background colors
<div className="bg-white dark:bg-gray-900">Content</div>

// Text colors
<p className="text-gray-900 dark:text-gray-100">Text</p>

// Using DaisyUI semantic colors (automatically themed)
<div className="bg-base-100 text-base-content">
  Automatically adapts to theme
</div>
```

---

## Migration Checklist

- [ ] Install Tailwind CSS, PostCSS, Autoprefixer
- [ ] Install DaisyUI and typography plugin
- [ ] Copy tailwind.config.ts with custom themes
- [ ] Copy globals.css with custom styles
- [ ] Set up Next.js font optimization
- [ ] Create theme store (Zustand)
- [ ] Create ThemeProvider component
- [ ] Create ThemeToggle component
- [ ] (Optional) Initialize shadcn/ui
- [ ] Test light/dark mode switching
- [ ] Verify all DaisyUI components render correctly

---

## Files Reference

| SvelteKit File          | Next.js File                    |
| ----------------------- | ------------------------------- |
| `tailwind.config.cjs`   | `tailwind.config.ts`            |
| `src/tailwind.css`      | `src/app/globals.css`           |
| `postcss.config.cjs`    | `postcss.config.js`             |
| Theme store (in layout) | `src/lib/stores/theme-store.ts` |

---

## Next Steps

-> [09-TESTING-DEPLOYMENT.md](./09-TESTING-DEPLOYMENT.md) - Testing strategy and Vercel deployment
