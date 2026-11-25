# SETHIS — Football Games & Entertainment

SETHIS is a football gaming and entertainment platform accessed through its official Telegram Mini App. Members play football games, build a game record, compete on shared rankings, earn eligible SETHIS rewards and invite their football community.

## Current games

- **Mystery Footballer** — choose Easy, Medium or Hard and answer a daily set of five multiple-choice football questions. Each question has four options. One incorrect answer ends the attempt; answering all five correctly earns the full SETHIS reward for the selected difficulty.
- **Football Runner** — a playable football running game with account-linked runs, SETHIS rewards and participation in the shared game rankings.

## Member experience

1. **Games** — open Mystery Footballer or Football Runner.
2. **Tasks** — complete available football quizzes, member missions, check-ins and reward activities.
3. **Rankings** — compare recorded game performance across the games. Spending GT does not buy ranking points.
4. **Referrals** — use personal invite links and track qualification and rewards.
5. **Wallet** — view separate GT and SETHIS balances and recorded transactions.

## Tokens and rewards

- **GT (Game Token)** is the in-app participation currency used for eligible game access and activities.
- **SETHIS** is the separate platform reward token credited for eligible game and task rewards.
- GT and SETHIS are distinct balances and are not interchangeable.
- Wallet credits and debits are validated by the server and recorded in the wallet ledger.
- Rewarded-ad GT credits are issued only after the provider confirms a valid valued event.

## Access

SETHIS gameplay is available through the official Telegram Mini App. A Telegram account and registered member session are required; a general browser session is not a substitute for Telegram access.

The authoritative current rules and product guidance are in **[Current Product Direction](docs/PRODUCT_DIRECTION.md)**.

> The Phase One, Phase Two and Phase Three planning documents are historical project records from the former Courts/debate direction. They are not the current product specification.

## Stack

- React + TypeScript + Vite
- Cloudflare Workers for backend services and web delivery
- Cloudflare D1 for persistent application data
- Cloudflare R2 for media storage when required
- Telegram Mini App for the member experience
- Private Admin Portal for game content, wallet operations, tasks, referrals, moderation and support

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
