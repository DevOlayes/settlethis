# SETHIS — Football Games & Entertainment

SETHIS is a mobile-first football gaming and entertainment platform delivered as a Telegram Mini App. Members play football challenges, build a game record, compete on rankings, earn eligible rewards and invite their football community.

**The first featured game is Guess Who? / Mystery Footballer.** A player's identity is hidden behind three clues and up to three guesses. Correct answers earn game points, with earlier guesses earning more points. Additional football games will be introduced as they are ready.

## Current product experience

The member app is organised around five destinations:

1. **Games** — the home for featured and future football games. Mystery Footballer is the first featured title.
2. **Tasks** — daily football quizzes, member missions, check-ins and eligible reward activities.
3. **Rankings** — competitive standings based on recorded game performance. CT spending does not buy a higher rank.
4. **Referrals** — personal invitations, qualification progress and published referral rewards.
5. **Wallet** — separate CT and SETHIS balances, rewarded-ad access and transaction records.

Help & Information and Customer Care explain the current game rules, tokens, rewards, account requirements and support process.

## Core product rules

- Registered membership is required. Guest play is not available.
- **CT** is the in-app participation currency used for eligible game entries and activities.
- **SETHIS** is a separate platform reward token. It is not interchangeable with CT.
- Every wallet credit and debit is recorded in the server-side ledger.
- Rewarded-ad credits are issued only after provider verification.
- Mystery Footballer scoring is based on when the player is identified: 100 points on clue one, 70 on clue two and 40 on clue three.
- Game rankings reflect recorded performance, not token spending.
- The Games hub is designed to grow as more football game formats are developed.

The detailed current direction, product rules and development sequence are documented in **[Current Product Direction](docs/PRODUCT_DIRECTION.md)**.

> Historical Phase One, Phase Two and Phase Three plans describe the previous Court/debate concept and are retained for project history only. They are not the current product roadmap.

## Stack

- React + TypeScript + Vite
- Cloudflare Workers for backend services and web delivery
- Cloudflare D1 for persistent application data
- Cloudflare R2 for media storage when required
- Telegram Mini App as the primary member experience
- Browser-based private Admin Portal for game content, wallet operations, tasks, referrals, moderation and support

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

For Workers Builds, configure:

- Production branch: `main`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Root directory: repository root

Database and other Cloudflare resources must be provisioned and configured before their related features can work in production.
