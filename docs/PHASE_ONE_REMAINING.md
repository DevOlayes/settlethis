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
- [ ] Audit Admin editorial verdict flow, immutable adjudication record, winner reward idempotency, and participant outcome history.
- [ ] Audit Pool Court lifecycle: scheduled/open/locked/settled/cancelled, reserve attestation, entry/stake debit, minimum stake, side totals, close deadline.
- [x] Preserved proportional Pool Court distribution with deterministic largest-remainder allocation; the adjudication now records the count of participants who actually receive a positive SETHIS credit, keeping zero-value rounding outcomes from falsely failing the ledger audit.
- [x] Guard Pool Court adjudication, prize credits, position settlement and verdict notifications so they can only run against the matching locked-to-settled adjudication; guarded Regular Court verdict notifications against cancelled/unsuccessful settlement races. (Real concurrent D1 transaction tests remain outstanding.)
- [ ] Audit Pool Court losing-side outcome and duplicate settlement protection end-to-end.
- [ ] Audit cancellation/refunds and reserve release consistency.
- [x] Added Node built-in unit tests for proportional Pool Court allocation, deterministic remainder distribution, zero-value outcomes and invalid input; the four allocation tests pass under Node 22.16.
- [x] Validated the revised Regular/Pool settlement SQL statements against production D1 using read-only EXPLAIN queries; no production rows were changed.
- [ ] Add D1-backed automated tests for critical Court and settlement transactions, including concurrent/duplicate requests.

## Wallet and reward integrity
- [ ] Verify every CT/SETHIS mutation is atomic with ledger and idempotency reference.
- [x] Expanded the production wallet integrity audit to 32 checks, including orphaned Court/Pool CT debits and refunds, ineligible Court/Pool prize recipients, proportional Pool prize bounds, orphaned task/referral credits, and agreement between Court outcome fields and immutable adjudication records.
- [x] Executed all 32 wallet integrity SQL checks against the current production D1 schema/data; all returned zero issues. This is only a clean-baseline check: the database currently has no wallet entries, Regular Court participants, Pool positions, task claims or referrals to exercise transaction scenarios.
- [ ] Exercise the 32-check wallet integrity audit against representative seeded scenarios and correct any false positives/omissions.
- [ ] Verify welcome gift, Admin grant, Court entry/debit, Court reward, Pool stake/prize/refund, task/referral/ad credits.
- [ ] Confirm balances cannot be changed through client-supplied values or unauthenticated requests.

## Tasks, referrals, ads
- [ ] Verify task catalog/UI rewards match actual claim/review/credit logic, including the owner-supplied social destinations.
- [x] Improved task-claim duplicate handling so already-pending and already-approved tasks return accurate conflict responses instead of reporting a false new submission.
- [ ] Test social task submission, admin review, approved credit, rejected resubmission and duplicate prevention end-to-end.
- [x] Made referral qualification retry-safe: repeat welcome-gift confirmation now rechecks an eligible invitee and can complete a missed qualification/milestone after a partial failure, without double-crediting the inviter.
- [ ] Test referral deep link attribution, self-referral/duplicate prevention, onboarding+gift qualification, 3-referral milestone and exactly-once 500 SETHIS with multiple Telegram accounts.
- [x] Configured the Monetag main zone `12269852` and private postback secret as Cloudflare Worker secrets; confirmed both secret bindings exist on the production Worker (values are not readable through Cloudflare secret metadata).
- [x] Standardized on the React `monetag-tg-sdk` package as the sole SDK loader; removed the duplicate HTML SDK script tag.
- [x] Improved rewarded-ad confirmation UX: distinguish valued, non-valued and pending server postback outcomes; removed stale Wallet copy that always claimed setup was pending.
- [x] Implemented server-side reward validation for `valued` events only, main-zone validation, placement validation, unique `ymid` idempotency, one reward per user per 20 minutes, Lagos daily cap 30, and 100 CT Home / 150 SETHIS Tasks rewards.
- [x] Owner confirmed the complete Monetag SSP main-zone Postback URL has been entered. The external Monetag dashboard configuration cannot be independently inspected from the connected Cloudflare account.
- [ ] Run the real valued-ad credit test inside Telegram and confirm exactly one wallet credit; owner plans to do this after the build is ready.
- [ ] Add official Telegram/Facebook/WhatsApp destinations when supplied.

## Community and account
- [x] Corrected the check-in calendar to show the trailing six days plus today, matching its rolling seven-day history label rather than displaying future dates.
- [ ] Test Telegram initData verification, onboarding resume/completion and account profile persistence; test check-in Lagos midnight boundary, duplicate prevention and streak calculation.
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
- [ ] Verify rankings metric/formula, tie-breaks, resolved-entry counts, win rate, SETHIS earned and user identity against representative seeded records.
- [ ] Test Rankings and My Courts using representative seeded records and real Telegram participants.

## Admin Portal security
- [x] Added server-side failed-login throttling: five attempts per IP hash within 15 minutes, generic credential errors, successful-login reset, and automatic cleanup of expired attempt records.
- [x] Added migration `0021_admin_login_rate_limits.sql` and applied the table/index to production D1; validated the login rate-limit SQL with read-only EXPLAIN checks.

## Launch validation
- [x] Added a GitHub Actions verification workflow to run `npm test` and `npm run build` on pushes to `main` and pull requests.
- [x] Confirmed GitHub Actions workflow runs successfully on commit `2ce3760fbcf4469188b0b388e5a78e8fad385099`: settlement unit tests and application/Worker build passed. Re-run after subsequent commits.
- [ ] Add D1-backed automated tests and/or safe staging fixtures for critical transaction paths.
- [ ] Run Telegram multi-user test: onboarding, join, argue/reply/react, verdict, reward, wallet, rankings, report.
- [ ] Check mobile errors/loading/empty states and production logs.
- [ ] Complete security review and beta readiness checklist.

## External configuration / owner inputs
- [x] Monetag main Zone ID and private postback secret are configured as production Worker secret bindings.
- [x] Owner confirmed the complete Monetag SSP postback URL has been entered.
- [ ] Run the real valued-ad credit test later, after the Phase One build is ready.
- [ ] Official Telegram channel, Facebook page and WhatsApp community URLs.
- [ ] Telegram BotFather Menu Button and bot avatar confirmation.
