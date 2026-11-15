# Phase One — Remaining Implementation Tracker

This file is the live checklist for completing Phase One. Preserve the approved UI; implement missing behavior and fix defects behind it.

## Courts and settlement
- [x] Fixed argument reactions missing `closes_at` in their Court lookup; reactions now enforce the Court deadline. (Further participation audit remains.)
- [x] Guarded Regular Court reward wallet/ledger credits against a conflicting duplicate verdict by requiring the recorded adjudication's winning side to match the payout side.
- [x] Guarded the Regular Court status/outcome update and API confirmation against a conflicting concurrent verdict; the displayed Court outcome must now match the immutable adjudication record.
- [x] Extended the wallet integrity audit to detect Regular and Pool Court outcome fields that disagree with their immutable adjudication records.
- [x] Moved Regular and Pool Court entry deadline checks into the same database statements that create the CT debit, closing a race where a late request could pass an earlier status check.
- [x] Added safe cancellation for scheduled Pool Courts; pending reserves need no release attestation, while secured reserves require a release reference and explicit confirmation.
- [x] Exposed Pool Court reserve-attestation state in the member UI so a scheduled pool with an unconfirmed reserve is labelled as a proposed prize and cannot be mistaken for an open, funded pool.
- [x] Audited Admin editorial verdict flow: immutable one-per-Court adjudication, matching-side settlement, idempotent fixed winner reward, participant status/history and verdict notifications. Concurrent transaction tests remain outstanding.
- [x] Audited Pool Court scheduled/open/locked/settled/cancelled lifecycle, reserve attestation, open/close windows, minimum stake, side totals and locked-before-verdict rules. Stake transaction now independently requires a secured reserve; future opening times are labelled scheduled in the member feed.
- [x] Preserved proportional Pool Court distribution with deterministic largest-remainder allocation; the adjudication now records the count of participants who actually receive a positive SETHIS credit, keeping zero-value rounding outcomes from falsely failing the ledger audit.
- [x] Guard Pool Court adjudication, prize credits, position settlement and verdict notifications so they can only run against the matching locked-to-settled adjudication; guarded Regular Court verdict notifications against cancelled/unsuccessful settlement races. (Real concurrent D1 transaction tests remain outstanding.)
- [x] Audited losing-side settlement and duplicate protection: all positions settle, only positive winning allocations are credited, adjudication is unique and wallet credits require the matching settled winner. Concurrent transaction tests remain outstanding.
- [x] Audited Regular and Pool cancellation/refund batches: cancellation state gates credits, idempotency keys prevent repeat refunds, participant/position state changes require the refund ledger, and secured Pool reserves require a recorded release reference. End-to-end refund scenarios remain to be exercised.
- [x] Added Node built-in unit tests for proportional Pool Court allocation, deterministic remainder distribution, zero-value outcomes, tie-breaking, prize conservation across uneven stakes, safe-integer arithmetic and invalid input; the seven allocation tests were executed locally under Node 22; the main-branch verification workflow also runs the complete test suite.
- [x] Expanded Telegram initData tests for missing tokens, oversized payloads and the exact 24-hour expiry boundary.
- [x] Extracted HTTPS-only URL validation used by editorial evidence, social-task destinations/proof and image/source links; added tests for accepted HTTPS URLs and rejected schemes/invalid input (23 Pool Court, URL-validation, Telegram-authentication, Lagos check-in and Monetag idempotency tests pass locally under Node 22).
- [x] Validated the revised Regular/Pool settlement SQL statements against production D1 using read-only EXPLAIN queries; no production rows were changed.
- [x] Exercised critical transaction SQL against the separate `sethis-phase-one-test` D1 database: welcome gift credits exactly once, check-in uniqueness holds, referral qualification reaches three and credits exactly 500 SETHIS once, Pool staking is blocked while reserve is pending, duplicate Pool stake rolls back without a second debit, and cancellation returns CT/releases the reserve exactly once. No production rows were changed.
- [ ] Convert these staging scenarios into repeatable automated D1 tests and add true concurrent-request coverage for Court and Pool settlement.

## Wallet and reward integrity
- [x] Source-audited every Worker wallet balance mutation: welcome gift, admin grant, task/referral/ad reward, Court entry/reward/refund and Pool stake/prize/refund are batched with ledger/idempotency checks.
- [x] Expanded the production wallet integrity audit to 32 checks, including orphaned Court/Pool CT debits and refunds, ineligible Court/Pool prize recipients, proportional Pool prize bounds, orphaned task/referral credits, and agreement between Court outcome fields and immutable adjudication records.
- [x] Executed all 32 wallet integrity SQL checks against the current production D1 schema/data; all returned zero issues. This is only a clean-baseline check: the database currently has no wallet entries, Regular Court participants, Pool positions, task claims or referrals to exercise transaction scenarios.
- [ ] Exercise the 32-check wallet integrity audit against representative seeded scenarios and correct any false positives/omissions.
- [x] Verified welcome gift, referral milestone, Pool stake/reserve gate, duplicate stake rollback, Pool refund and reserve release against the separate staging D1 database; Admin grant, Regular Court reward settlement, Pool prize settlement, task approval and the real Monetag provider callback remain to be exercised; Regular Court entry and Pool stake/refund were verified in staging.
- [x] Confirmed there is no client balance-setting API; wallet mutations require verified Telegram identity, an authenticated Admin session or the secret-verified Monetag postback, with server-side amounts and transaction checks.

## Tasks, referrals, ads
- [x] Compared production task catalog with member UI and server rewards: Telegram 150, Facebook 100, WhatsApp 70, invite-three milestone 500 SETHIS; ad placements remain 100 CT Home / 150 SETHIS Tasks. Referral milestone is server-settled rather than a manual claim.
- [ ] Add the owner-supplied social destinations; those rows remain hidden until valid HTTPS links are configured.
- [x] Improved task-claim duplicate handling so already-pending and already-approved tasks return accurate conflict responses instead of reporting a false new submission.
- [x] Require a configured official destination and an HTTPS proof link before accepting manual social-task claims; the Admin review queue displays the submitted evidence link.
- [ ] Test social task submission, admin review, approved credit, rejected resubmission and duplicate prevention end-to-end.
- [x] Made referral qualification retry-safe: repeat welcome-gift confirmation now rechecks an eligible invitee and can complete a missed qualification/milestone after a partial failure, without double-crediting the inviter.
- [x] Verified the onboarding+welcome-gift qualification condition and exactly-once 500 SETHIS milestone using three separate synthetic invitee identities in staging D1.
- [ ] Test real Telegram referral deep-link attribution, self-referral/duplicate prevention and the milestone with multiple Telegram accounts.
- [x] Configured the Monetag main zone `12269852` and private postback secret as Cloudflare Worker secrets; confirmed both secret bindings exist on the production Worker (values are not readable through Cloudflare secret metadata).
- [x] Standardized on the React `monetag-tg-sdk` package as the sole SDK loader; removed the duplicate HTML SDK script tag.
- [x] Improved rewarded-ad confirmation UX: distinguish valued, non-valued and pending server postback outcomes; removed stale Wallet copy that always claimed setup was pending.
- [x] Implemented server-side reward validation for `valued` events only, main-zone validation, placement validation, unique `ymid` idempotency, one reward per user per 20 minutes, Lagos daily cap 30, and 100 CT Home / 150 SETHIS Tasks rewards.
- [x] Owner confirmed the complete Monetag SSP main-zone Postback URL has been entered. The external Monetag dashboard configuration cannot be independently inspected from the connected Cloudflare account.
- [ ] Run the real valued-ad credit test inside Telegram and confirm exactly one wallet credit; owner plans to do this after the build is ready.
- [ ] Add official Telegram/Facebook/WhatsApp destinations when supplied.

## Phase One scope cleanup
- [x] Cancelled the generic production Pool Court placeholder after confirming it had no attested reserve, positions, adjudication or wallet ledger entries; no fake pool remains open or scheduled for members.
- [x] Removed the unfinished sample football quiz from the Phase One Tasks page; quizzes remain a later-phase feature rather than a non-functional placeholder.
- [x] Hide social task rows until their official destination URLs are configured, instead of displaying dead-end buttons or setup notices.

## Community and account
- [x] Corrected the check-in calendar to show the trailing six days plus today, matching its rolling seven-day history label rather than displaying future dates.
- [x] Extracted Lagos check-in date/streak logic and added automated tests for the 23:00 UTC date boundary, current streaks, yesterday fallback and seven-day calendar window.
- [x] Extracted Telegram initData verification and added automated tests for valid HMAC signatures, tampering, expiry, future timestamps and invalid identity payloads.
- [x] Verified duplicate daily check-in insertion is constrained to one row per Telegram user/date in staging D1.
- [x] Verified the exact Monetag wallet-credit SQL only updates the balance once when the same valued event is replayed; the staging D1 test records one ledger event and one 100 CT credit. The real provider callback test remains pending.
- [ ] Test onboarding resume/completion, account profile persistence and check-in persistence with real Telegram accounts.
- [ ] Test notifications for argument/reply/reaction/verdict/wallet/referral/task events and read states.
- [ ] Test reports for users/Courts/arguments/replies; moderation queue, hide/restore, restriction/suspension, audit log and enforcement.
- [x] Added server-side community limits: 20 arguments/hour, 60 replies/hour and 10 reports/hour per user; identical argument/reply submissions within two minutes are rejected, and restricted users cannot react.
- [x] Enforced Court visibility/moderation status in join, argument, reply and reaction paths so hidden/removed Courts cannot be modified through direct API requests.
- [x] Enforced parent/target moderation visibility for replies and reactions, and excluded hidden replies from member reply lists and visible reply counts.
- [x] Added supporting rate-limit indexes in migration `0020_community_rate_limits.sql` and applied those indexes to production D1; validated the three guarded INSERT statements with read-only SQL EXPLAIN.
- [ ] Complete real Telegram multi-user tests for the new limits, duplicate handling and moderation enforcement.

## Rankings and history
- [x] Implemented rankings with the documented wins → win rate → SETHIS earned → entries tie-break order, a stable row-number rank, and an authenticated member's own rank even when outside the top 100.
- [x] Connected homepage SETHIS earned and member rank figures to ledger-backed and settled-outcome data instead of fixed placeholder dashes.
- [x] Validated the rankings SQL and wallet/reward/refund/check-in transaction statements against production D1 with read-only EXPLAIN checks; no fixture rows were written.
- [ ] Verify rankings metric/formula, tie-breaks, resolved-entry counts, win rate, SETHIS earned and user identity against representative seeded records.
- [ ] Test Rankings and My Courts using representative seeded records and real Telegram participants.

## Admin Portal security
- [x] Locked first-admin creation behind the owner-only `ADMIN_SETUP_SECRET`, compared in constant time; the Admin Portal asks for the one-time key and refuses setup when the Worker binding is absent. Production D1 already contains one administrator record, so first-admin registration is currently closed.
- [x] Rate-limited first-admin setup attempts to five per IP hash per 15 minutes using the same atomic limiter as Admin sign-in.
- [x] Require same-origin requests for all Admin and editorial write endpoints, in addition to the HttpOnly, Secure, SameSite=Strict session cookie.
- [x] Added the `ADMIN_SETUP_SECRET` secret binding, `admin_setup_authorizations` table and a D1 trigger that rejects first-admin inserts without a short-lived authorization row. The new Worker creates that row and the admin record in one atomic batch. The currently deployed Worker is still on the older revision until the deployment credential is configured and the new code is deployed.
- [x] Added server-side failed-login throttling: five attempts per IP hash within 15 minutes, reserved atomically so concurrent requests cannot bypass the limit, generic credential errors, successful-login reset, and automatic cleanup of expired attempt records.
- [x] Added migration `0022_admin_login_rate_limits.sql` and applied the table/index to production D1; validated the login rate-limit SQL with read-only EXPLAIN checks.

## Launch validation
- [x] Added a GitHub Actions verification workflow to run `npm test` and `npm run build` on pushes to `main` and pull requests.
- [x] Confirmed Cloudflare Workers Builds is configured for the `main` branch with `npm run build` and `npx wrangler deploy`; GitHub Actions is kept focused on tests/build verification so a missing GitHub Actions API token cannot appear as a successful production deployment.
- [x] Verified the full Cloudflare Workers Build for source revision `284d7bc468179a265e0aac729eb68f89669dbdc9`: all 20 automated tests passed, TypeScript/Vite production build passed, and the deployment command was deliberately held at a no-op so this verification did not change production.
- [ ] Add D1-backed automated tests and/or safe staging fixtures for critical transaction paths.
- [ ] Verify a Cloudflare Workers Build for the latest `main` commit completes and the resulting Worker version receives 100% traffic; the live Worker is currently on an older source revision.
- [ ] Run Telegram multi-user test: onboarding, join, argue/reply/react, verdict, reward, wallet, rankings, report.
- [ ] Check mobile errors/loading/empty states and production logs.
- [ ] Complete security review and beta readiness checklist.

## External configuration / owner inputs
- [x] Monetag main Zone ID and private postback secret are configured as production Worker secret bindings.
- [x] Owner confirmed the complete Monetag SSP postback URL has been entered.
- [ ] Run the real valued-ad credit test later, after the Phase One build is ready.
- [ ] Official Telegram channel, Facebook page and WhatsApp community URLs.
- [ ] Telegram BotFather Menu Button and bot avatar confirmation.
