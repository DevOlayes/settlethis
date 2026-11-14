# Settle This! (SETHIS)

Initial deployment scaffold for the Settle This! web experience and Telegram Mini App.

## Stack

- React + TypeScript
- Vite
- Cloudflare Workers with static assets
- Cloudflare D1 will be added when the database is provisioned

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

No secrets or database resources are required for this initial static deployment.
