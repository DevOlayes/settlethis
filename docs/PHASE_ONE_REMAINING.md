# Phase One — Remaining Implementation Tracker

This file is the live checklist for completing Phase One. Preserve the approved UI; implement missing behavior and fix defects behind it.

## Courts and settlement
- [x] Fixed argument reactions missing `closes_at` in their Court lookup; reactions now enforce the Court deadline. (Further participation audit remains.)
- [x] Guarded Regular Court reward wallet/ledger credits against a conflicting duplicate verdict by requiring the recorded adjudication's winning side to match the payout side.
- [x] Guarded the Regular Court status/outcome update and API confirmation against a conflicting concurrent verdict; the displayed Court outcome must now match the immutable adjudication record.
- [x] Extended the wallet integrity audit to detect Regular and Pool Court outcome fields that disagree with their immutable adjudication records.
- [x] Moved Regular and Pool Court entry deadline checks into the same database statements that create the CT debit, closing a race where a late request could pass an earlier status check.
- [x] Added safe cancellation for scheduled Pool Courts; pending reserves need no release attestation, while secured reserves require a release reference and explicit confirmation.
- [ ] Audit Admin editorial verdict flow, immutable adjudication record, winner reward idempotency, and participant outcome history.
- [ ] Audit Pool Court lifecycle: scheduled/open/locked/settled/cancelled, reserve attestation, entry/stake debit, minimum stake, side totals, close deadline.
- [x] Preserved proportional Pool Court distribution with deterministic largest-remainder allocation; the adjudication now records the count of participants who actually receive a positive SETHIS credit, keeping zero-value rounding outcomes from falsely failing the ledger audit.
- [ ] Audit Pool Court losing-side outcome and duplicate settlement protection end-to-end.
- [ ] Audit cancellation/refunds and reserve release consistency.
- [x] Added Node built-in unit tests for proportional Pool Court allocation, deterministic remainder distribution, zero-value outcomes and invalid input; the four allocation tests pass under Node 22.16.
- [ ] Add D1-backed automated tests for critical Court and settlement transactions, including concurrent/duplicate requests.

## Wallet and reward integrity
- [ ] Verify every CT/SETHIS mutation is atomic with ledger and idempotency reference.
- [x] Expanded the production wallet integrity audit to 28 checks, including orphaned Court/Pool CT debits, ineligible Court rewards, proportional Pool prize bounds, and agreement between Court outcome fields and immutable adjudication records.
- [ ] Exercise the 28-check wallet integrity audit against seeded scenarios and correct any false positives/omissions.
- [ ] Verify welcome gift, Admin grant, Court entry/debit, Court reward, Pool stake/prize/refund, task/referral/ad credits.
- [ ] Confirm balances cannot be changed through client-supplied values or unauthenticated requests.

## Tasks, referrals, ads
- [ ] Verify task catalog/UI rewards match actual claim/review/credit logic.
- [ ] Test social task submission, admin review, approved credit, rejected resubmission and duplicate prevention.
- [ ] Test referral deep link attribution, self-referral/duplicate prevention, onboarding+gift qualification, 3-referral milestone and exactly-once 500 SETHIS.
- [x] Configured the Monetag main zone `12269852` and private postback secret as Cloudflare Worker secrets; confirmed both secret bindings exist on the production Worker (values are not readable through Cloudflare secret metadata).
- [x] Standardized on the React `monetag-tg-sdk` package as the sole SDK loader; removed the duplicate HTML SDK script tag.
- [x] Improved rewarded-ad confirmation UX: distinguish valued, non-valued and pending server postback outcomes; removed stale Wallet copy that always claimed setup was pending.
- [x] Implemented server-side reward validation for `valued` events only, main-zone validation, placement validation, unique `ymid` idempotency, one reward per user per 20 minutes, Lagos daily cap 30, and 100 CT Home / 150 SETHIS Tasks rewards.
- [ ] Confirm Monetag SSP main-zone Postback URL includes `secret`, `{ymid}`, `{zone_id}`, `{event_type}`, `{reward_event_type}`, `{estimated_price}`, `{request_var}`, and `{telegram_id}`; then test a real valued ad event inside Telegram and confirm exactly one wallet credit. Monetag sends postbacks independently of the frontend callback and retries failed deliveries.
- [ ] Add official Telegram/Facebook/WhatsApp destinations when supplied.

## Community and account
- [ ] Test Telegram initData verification, onboarding resume/completion and account profile persistence.
- [ ] Test notifications for argument/reply/reaction/verdict/wallet/referral/task events and read states.
- [ ] Test reports for users/Courts/arguments/replies; moderation queue, hide/restore, restriction/suspension, audit log and enforcement.
- [ ] Audit spam/rate limiting and duplicate reaction/submission controls.

## Rankings and history
- [ ] Verify rankings metric/formula, tie-breaks, resolved-entry counts, win rate, SETHIS earned and user identity.
- [ ] Test Rankings and My Courts using representative seeded records and real Telegram participants.

## Launch validation
- [ ] Add repeatable automated tests and/or safe staging fixtures for critical paths.
- [ ] Run Telegram multi-user test: onboarding, join, argue/reply/react, verdict, reward, wallet, rankings, report.
- [ ] Check mobile errors/loading/empty states and production logs.
- [ ] Complete security review and beta readiness checklist.

## External configuration / owner inputs
- [ ] Monetag Zone ID + configured private postback secret.
- [ ] Official Telegram channel, Facebook page and WhatsApp community URLs.
- [ ] Telegram BotFather Menu Button and bot avatar confirmation.
