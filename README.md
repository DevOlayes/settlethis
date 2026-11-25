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

Account-based gameplay, the wallet, tasks, rankings and reward-eligible activity require the official Telegram Mini App and a registered Telegram member session. A separate Football Runner browser preview is only a demo; preview runs are not saved to member accounts and do not earn rewards.

The authoritative current rules and product guidance are in **[Current Product Direction](docs/PRODUCT_DIRECTION.md)**.

> `PHASE_ONE.md`, `PHASE_ONE_REMAINING.md`, `PHASE_TWO.md`, `PHASE_THREE.md`, `SECURITY_REVIEW.md` and `SETHIS_TOKEN_ECOSYSTEM_RESEARCH.md` contain historical project records or dated reviews. Some describe the retired Courts/debate direction and old CT terminology. They are archives, not active product instructions. This README and [Current Product Direction](docs/PRODUCT_DIRECTION.md) define the current games product.

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
