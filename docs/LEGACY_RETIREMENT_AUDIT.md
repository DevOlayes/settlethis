# Legacy retirement and current-product alignment

**Status:** Completed and deployed  
**Date:** 2026-11-25  
**Pull request:** #3 — merged to `main`  
**Cloudflare Worker:** `settlethis`  
**Production database:** `sethis-production`

## Current release boundary

SETHIS is the Telegram Mini App for football games. The member experience is Games, Tasks, Rankings, Referrals and Wallet. The games are Mystery Footballer and Football Runner. The participation currency is GT; SETHIS is the separate reward token.

Preserved current systems:
- Mystery Footballer five-question daily sets, Easy/Medium/Hard rules, 900-question bank and configured rewards.
- Football Runner daily access, repeat runs, server-validated rewards and shared rankings.
- Wallet balances and ledger, task rewards and claims, referral programme, Monetag reward verification, football quizzes, Telegram member records, support, staff access, moderation and audit operations.
- Fixtures and quiz data used by the current quiz/task workflows.

## Retired systems

The following are no longer part of the active product:
- Courts, Pool Courts and their member participation, argument, reply, reaction, poll and settlement flows.
- Settle Argument episodes and debate-source ingestion/review.
- Sponsorship placements, sponsor campaign operations and affiliate placements/click tracking.
- The old clue-based Mystery Footballer implementation and player/clue/round records.
- Competition discovery and retired match-poll interfaces.

The current question-set Mystery Footballer API remains active at `/api/mystery-challenge`; the old clue-game API is retired.

## Source changes

- Removed SponsorSlot and AffiliateSlot from the member app and deleted those components.
- Removed the unused CompetitionDiscovery component.
- Removed the old debate-sourcing Admin component.
- Stopped Admin initialization from loading retired editorial, poll, Court, Pool, sponsorship and affiliate data.
- Retired the old Worker API handlers and blocked remaining legacy path variants with HTTP 410 responses.
- Removed debate ingestion from the scheduled Worker path.
- Updated profile history and achievements to reflect five-question Mystery Footballer sets.
- Updated shared rankings to use Football Runner runs and Mystery Footballer attempts.
- Updated wallet-integrity checks to validate current Runner, Mystery Footballer, quiz, task, referral, rewarded-ad and wallet ledger flows.
- Fixed Mystery Footballer question progression so each correct answer advances to the next question and the fifth correct answer settles the perfect set.

## Production deployment and database changes

- Cloudflare Workers Build completed successfully from `main`.
- Build ID: `3fd4063b-80e9-447d-8def-41c0e7917861`.
- Deployed Worker version: `5d480642-9f25-461e-b0b0-a1cd68f0f22f`.
- Deployment time: `2026-11-25T16:56:13.847Z`.
- Additive migration `0059_admin_analytics_country.sql` was applied to production before deployment. It adds the approximate country code field and per-game presence table/index.
- Forward migration `0060_retire_legacy_product_tables.sql` was applied after the Worker deployment. All legacy Courts, Pool, debate, sponsorship, affiliate, match-poll and clue-game tables were dropped in foreign-key-safe order.
- Forward migration `0061_retire_legacy_competition_tables.sql` removed the unused competition catalogue and matchday editorial proposal queue. Fixture records remain because the current quiz workflow still uses them.
- Production verification found no remaining tables matching the retired feature groups.
- Current data was preserved: 900 active Mystery Footballer questions (300 per difficulty), Telegram member and wallet records, Runner runs, fixtures, quizzes and quiz questions remain present.
- GT and SETHIS balances and wallet ledger records were not deleted or rewritten.

## Verification

- The GitHub verification workflow passed before merge.
- The Cloudflare production build completed and the Worker deployment succeeded.
- The deployed Worker contains the current Admin overview, Runner settings, Mystery Footballer settings, question-set game API and current profile/ranking logic.
- Production D1 checks confirmed the new country and presence schema, the full 900-question bank and absence of retired feature tables.

## Remaining operational checks

The remaining checks are normal live product acceptance checks, not legacy cleanup work:
- Test with real Telegram accounts on mobile.
- Complete a full Easy, Medium and Hard Mystery Footballer set and verify reward settlement.
- Complete a Football Runner access cycle and verify repeat runs and reward rules.
- Review the redesigned Admin Portal, wallet audit, task administration, referrals, support and moderation.
- Confirm Telegram bot settings, official social links, security headers and production logs with the product owner.

Applied migration files are immutable. Any future schema change must be a new numbered forward migration.
