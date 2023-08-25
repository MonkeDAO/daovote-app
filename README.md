# DaoVote

An open source solution to governance

- DaoVote enables you to create a Votebank per DAO or multiple if needed
- Votebanks can have two different kind of restrictions:
  - NFT gated voting
  - Token gated voting
- <details>
    <summary>
    <bold>Highly customizable</bold>: Set it up for your DAO today!
    </summary>
  </details>

## Links

- https://github.com/MonkeDAO/daovote-app
- https://github.com/MonkeDAO/omcvote

## Developer Experience

_Making this easier to maintain and focus on writing not coding._

- [Sveltekit](https://kit.svelte.dev/)
- ESLint + Prettier
- [Daisy UI with Tailwind](https://daisyui.com/)

## Setup

### Step 0: Clone project

```bash
git clone https://github.com/MonkeDAO/omcvote.git
yarn install
yarn dev # Launches site locally at http://localhost:5173/
```

### Step 1: Configuration

If you already have a Votebank created on the main omcvote deployed program, remember to configure `/lib/siteConfig.js` with the Votebank key - there are other variables there that can be useful.

```js
export const SITE_URL = 'https://monkedao.io';
export const SITE_TITLE = 'DaoVote';
export const SITE_DESCRIPTION = 'On Chain Voting for DAOs';
export const MY_TWITTER_HANDLE = 'MonkeDAO';
```

Use `.env.example` to populate env variables. Helius is recommended for fetching NFTs. The mainnet url is needed for interracting with ShadowDrive as it only works on mainnet.

## Todos

- Add back in Newsletter
