# Settle This! — Phase One Delivery Plan

## Phase One goal

Deliver the first genuinely usable version of Settle This!: a football entertainment platform where people discover structured football debates ("Courts"), take a side, make arguments, engage with the other side, and see a community verdict with a transparent result history.

Phase One is not just a visual prototype. It includes the core user journey, persistent data, moderation basics, and a working reward ledger. The interface must be mobile-first and built for use inside the Telegram Mini App. Browser access remains available for development, visual inspection and the private administrator console; it is not a separate public product or browser-account experience.

## Product principles

- Football entertainment is the umbrella; controversies and moments are the content engine; a competitive football community is the retention engine.
- A Court is a structured debate around a football question, incident, decision, player, manager, transfer, or match.
- The product must not look or behave like a generic forum, betting app, fantasy game, or creator platform.
- Platform-created Courts come first. User-created Courts are deferred until moderation and quality controls are proven.
- The approved visual system uses Midnight Navy (#0B1220), Deep Slate (#121D2E), Raised Slate (#1A2940), Electric Cyan (#27D7F2), white primary text, and restrained Stadium Gold (#F5B942) only for rewards and wins.
- Use the approved standalone S monogram currently displayed in the app header consistently across the Mini App, Wallet, gift reveal, and Admin Portal.

## Phase One scope

### A. Main navigation and account

1. Courts — the discovery home and primary destination.
2. My Courts — entered Courts, contributions, outcomes, and history.
3. Tasks — daily missions, streaks, and eligible reward activities.
4. Rankings — participant standings and winners.
5. Wallet — Court Tokens (CT), SETHIS rewards, and transaction history.

Also deliver Telegram-based identity, onboarding, user profile, club selection, notifications, and basic account settings. The Telegram identity is the user account identity; do not add a separate public browser registration/login flow in Phase One.

### B. Courts discovery

- Today's Biggest Controversy feature.
- Featured and trending Courts.
- Browse by category: Manager's Court, Referee's Court, Player's Court, Transfer Court, Match Court, and Football Debate.
- Court status, participation count, time remaining or closing state, and entry type must be clear.
- Shareable Court links.

### C. Court participation

- Court detail page with the question, context, rules, opposing positions, activity and closing information.
- Enter Court and choose a side.
- Submit an argument and reply to opposing arguments.
- Reactions and basic participation indicators.
- Clear rules for eligibility, deadlines, judging/verdict method, and reward settlement before entry.
- Prevent duplicate or invalid entries and enforce Court status and deadlines.

### D. Verdicts and history

- Courts can be opened, active, closing, under review, settled, or cancelled.
- A defined verdict process must be visible before participation.
- Publish the verdict and settlement summary.
- Preserve a user's Court history and past outcomes.
- Provide a basic dispute/report path for moderation review.

### E. Tasks, rewards and wallet

- Tasks hub with mandatory seven-story onboarding, one-time 3,500 CT welcome gift, daily check-in streak, social tasks, referral milestone, and rewarded-ad placements.
- Social task rewards: Telegram 150 SETHIS, Facebook 100 SETHIS, WhatsApp 70 SETHIS; claims require verification and moderator approval unless a provider-side verification path is configured.
- Referral milestone: 500 SETHIS after three invited members complete onboarding and claim their welcome gift. Referral attribution uses Telegram Mini App deep links.
- Monetag Rewarded Interstitial placements: Home = 100 CT; Tasks = 150 SETHIS. One shared 20-minute cooldown and a maximum of 30 verified ad events per user per Lagos calendar day. Monetag postbacks are the only source of ad reward credits.
- CT is the activity/entry currency. It is not the same as SETHIS.
- SETHIS is the main reward token earned through eligible winning and reward activities.
- Record every credit, debit, reversal, and settlement as an auditable ledger transaction.
- Show balances and transaction history.
- Rewarded-ad integrations may be added only with a verified provider and server-side reward validation. Never credit a reward merely because the client says an ad was watched.
- Initial token amounts, minimum entry amounts, pool mechanics, and conversion/value claims remain configurable and are not fixed by this plan.

### F. Rankings and community safety

- Basic rankings based on transparent, defined Phase One metrics.
- User reporting for arguments and accounts.
- Admin/moderator tools to review task claims and reports, hide/remove/restore reported content, restrict or suspend accounts, and resolve disputed Courts.
- Notification events for Court arguments, replies, reactions, verdicts, wallet credits, referrals, and task rewards.
- Rate limits and anti-spam protections for submissions and reactions.
- A clear audit trail for moderation and wallet adjustments.

## Technical delivery

- Frontend: React, TypeScript, Vite.
- Backend: Cloudflare Workers.
- Database: Cloudflare D1.
- Media storage: Cloudflare R2 when user-uploaded media is introduced.
- Telegram Mini App: Telegram Web App integration with server-verified identity.
- Browser web app: same core services and account model.
- Wallet and settlement operations must be performed and validated server-side. Do not trust client-submitted balances, outcomes, or reward amounts.
- Use migrations, environment-specific configuration, input validation, authentication/authorization checks, and automated tests for critical flows.

## External configuration still required

- Set the Monetag main Rewarded Interstitial zone ID as `MONETAG_ZONE_ID` and a private `MONETAG_POSTBACK_SECRET` as Worker secrets. Configure Monetag postbacks to `/api/ads/monetag/postback` with its documented macros, including `ymid`, `reward_event_type`, `zone_id`, `request_var`, and `telegram_id`. The SDK and server-side reward handler are implemented; ad playback remains disabled until those values are configured and tested inside Telegram.
- Add the official Telegram channel, Facebook page, and WhatsApp community URLs to the matching `task_catalog.destination_url` records. The referral endpoint resolves the bot username through Telegram `getMe` when it is not explicitly configured.
- Telegram channel membership can be automatically checked only when the channel is public and the bot has the required administrator access; Facebook and WhatsApp claims remain moderator-reviewed.
- Production currently has no registered Telegram users or settled Court records, so rankings, reward settlement, referrals, and ad rewards must be exercised with real Telegram members before public launch.

## Build sequence

1. **Product and design foundation:** finalize the Phase One scope, design tokens, navigation, shared components, and the complete Courts home screen.
2. **Core UI:** build responsive navigation, Court discovery, Court detail, participation, My Courts, Tasks, Rankings, Wallet, profile, and notifications.
3. **Backend foundation:** provision D1, define schema and migrations, implement authentication and API/service boundaries.
4. **Court lifecycle:** create/manage platform Courts, join, argue, reply, react, close, moderate, publish verdicts, and record outcomes.
5. **Wallet and tasks:** implement the CT/SETHIS ledger, task eligibility, streaks, reward rules, and transaction history.
6. **Telegram and browser integration:** verify Telegram launch/authentication and ensure the browser path works against the same backend.
7. **Hardening and beta:** test mobile layouts, permissions, abuse controls, ledger integrity, failure states, accessibility, performance, and deployment.

## Phase One acceptance checklist

- A new user can register or authenticate, complete onboarding, and reach Courts.
- A user can discover a Court, understand its rules, enter, choose a side, submit an argument, reply, react, and report inappropriate content.
- A user can see their active and completed Courts in My Courts.
- A Court can be closed, reviewed, settled, and displayed with its verdict and outcome history.
- Tasks and rankings show real server-backed data, not decorative placeholder numbers.
- Social task claims are reviewed before credits; referral milestones are attributed and rewarded once.
- Monetag rewards are credited only from a unique, valued server postback and respect the shared cooldown and daily cap.
- CT and SETHIS balances are backed by an auditable server-side ledger.
- Moderators can review reports and take basic action.
- Core screens work on small mobile displays and in Telegram's in-app browser; browser access remains for development, visual inspection, and the private Admin Portal.
- Critical flows have automated tests and deployment/build checks pass.

## Explicitly deferred

- User-created Courts and open creator publishing.
- Native Android/iOS applications.
- Multiple leagues, languages, and regional expansion beyond the initial supported content.
- Advanced live match rooms, live halftime polls, quizzes, creator/host tools, and deep analytics.
- Crypto deposits, withdrawals, exchange listings, token trading, or guaranteed monetary value for SETHIS.
- Sponsorship and affiliate monetization beyond carefully tested initial ad/reward integrations.

## Decisions to finalize during implementation

- Initial supported countries, leagues, and football content schedule.
- Exact Court verdict model for each Court type (community vote, moderator decision, or a defined hybrid).
- Whether each Court is free, CT-entry, or a pool-based format; these must be clearly distinguished.
- CT and SETHIS initial balances, earning rates, entry limits, and anti-abuse rules.
- Initial ranking formula and reset period.
- Account recovery and any age/region eligibility rules.

These decisions should be configurable where possible and documented before they affect users' balances or competition outcomes.
