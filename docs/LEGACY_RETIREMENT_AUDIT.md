# Legacy retirement and current-product alignment

**Working branch:** `cleanup/current-product-alignment`  
**Baseline:** `main` at `08a36a7798d247f3a7080b8c9747e13cc0ac1904`  
**Audit date:** 2026-11-25  
**Status:** In progress. No production data or schema has been deleted.

## Current release boundary

SETHIS is the Telegram Mini App for football games. Current member destinations are Games, Tasks, Rankings, Referrals and Wallet. Current games are Mystery Footballer and Football Runner. The member-facing participation currency is GT (Game Token); SETHIS is the separate reward token.

Preserve the existing referral programme, task reward allocations, Monetag rewarded-ad crediting, game access and reward rules, shared rankings, wallet ledger, Telegram authentication, support, moderation, staff access and current Admin analytics/settings.

The retired Courts / Pool Courts / debate-episode product is not part of this release. Sponsorship and affiliate placements are out of scope.

## Confirmed legacy surfaces on baseline main

| Area | Confirmed evidence | Required treatment |
|---|---|---|
| Member app | `src/App.tsx` still contains Court, Pool, argument and episode models and Court-room UI. | Remove the old member experience as a coherent app-flow change; preserve shared account, wallet and moderation primitives. |
| Member placements | `SponsorSlot` and `AffiliateSlot` are imported and rendered in the old Court-room UI. | Remove member-facing placements and their callers. |
| Admin | `src/Admin.tsx` still declares sponsorship, affiliate, Court, Pool and Settle Argument state and section identifiers. | Rebuild navigation around current release operations; remove legacy screens and state in dependency-safe batches. |
| Worker | `src/worker.ts` still serves sponsorship, affiliate, Court and Settle Argument routes alongside current game routes. | Trace callers, then retire routes with no current-release consumer. Keep shared auth, wallet, audit and moderation services. |
| Migrations | `0031_sponsorship_foundation.sql`, `0032_sponsorship_measurement.sql`, `0033_affiliate_commerce.sql` and earlier Court/Pool migrations establish historical schema. | Keep applied migrations immutable. Inspect production tables and dependencies before any forward cleanup. |
| Docs | `docs/PRODUCT_DIRECTION.md` defines the current product; older phase and token research docs contain historical direction. | Make the current product definition authoritative and label historical material clearly. |

## Current-release data and code to protect

- Mystery Footballer daily five-question sets, difficulty levels, question bank and rewards.
- Football Runner daily access, repeat runs, server-validated rewards and shared rankings.
- GT and SETHIS balances, wallet ledger and integrity checks.
- Referral qualification/reward history and task definitions/claims/approvals.
- Monetag verification and rewarded-ad credits.
- Telegram authentication and member records.
- Current Admin analytics, member directory, Mystery Footballer settings, Runner settings, support, referrals, staff, moderation and audit capabilities.

## Database safety rules

1. Do not edit or delete already-applied migration files.
2. Do not drop a table until all source references, foreign keys, triggers, indexes, views, jobs and production row counts have been checked.
3. Preserve wallet ledger entries, balances, referral history, task claims, game attempts/results/rewards, question bank records, moderation history and audit history.
4. For confirmed isolated legacy tables, use a new numbered forward migration and back up affected production tables first.
5. No destructive production SQL during this audit.

## Work sequence

- [x] Create a dedicated cleanup branch and record the audit baseline.
- [ ] Trace the product-direction pivot and check which later commits carried it forward.
- [ ] Inventory member-app legacy screens, components and CSS.
- [ ] Inventory Admin navigation, loaders, forms and API dependencies.
- [ ] Inventory Worker routes and current-release consumers.
- [ ] Map migrations to live tables, triggers, foreign keys and production data.
- [ ] Remove legacy member surfaces and placements.
- [ ] Rebuild Admin navigation and retire legacy admin screens.
- [ ] Remove unreferenced Worker endpoints and feature-specific code.
- [ ] Add a forward-only database cleanup migration only for verified orphaned schema.
- [ ] Update current docs and label historical documents.
- [ ] Run typecheck, build, tests and code/dependency audits.
- [ ] Deploy only after source and schema are aligned; verify production and Telegram Mini App behavior.

This file records confirmed findings and the cleanup plan. It does not claim legacy code, routes or tables have already been removed. Production deployment and destructive database cleanup remain blocked pending dependency and backup checks.
