# Settle This! (SETHIS)

Settle This! is a football entertainment platform built around structured debates ("Courts"), opposing arguments, community verdicts, and competitive participation.

## Phase One

The first release focuses on the complete core journey: discover a Court, enter a side, argue and engage, receive a verdict, and review outcomes and rewards. It includes Courts, My Courts, Tasks, Rankings, Wallet, profiles, notifications, moderation basics, and a server-backed CT/SETHIS ledger.

The full scope, acceptance checklist, delivery sequence, and deferred features are documented in **[Phase One Delivery Plan](docs/PHASE_ONE.md)**. Phase Two delivery is tracked in the **[Phase Two Development Plan](docs/PHASE_TWO.md)**, and the current expansion and monetisation work is tracked in the **[Phase Three Plan](docs/PHASE_THREE.md)**.

## Stack

- React + TypeScript + Vite
- Cloudflare Workers for backend services and web delivery
- Cloudflare D1 for persistent application data
- Cloudflare R2 for media storage when required
- Telegram Mini App as the user-facing platform
- Browser-only private admin console and development/visual inspection access

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Deploy to Cloudflare

Authenticate Wrangler, then run:

```bash
npx wrangler deploy
```

The Worker serves the production build from `dist/`.

## Cloudflare Git integration

For Workers Builds, connect this repository and configure:

- Production branch: `main`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Root directory: repository root

Database and other Cloudflare resources must be provisioned and configured before their related features can work in production.
