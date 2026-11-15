# Phase One — Remaining Implementation Tracker

This file is the live checklist for completing Phase One. Preserve the approved UI; implement missing behavior and fix defects behind it.

## Courts and settlement
- [x] Fixed argument reactions missing `closes_at` in their Court lookup; reactions now enforce the Court deadline. (Further participation audit remains.)
- [ ] Audit Admin editorial verdict flow, immutable adjudication record, winner reward idempotency, and participant outcome history.
- [ ] Audit Pool Court lifecycle: scheduled/open/locked/settled/cancelled, reserve attestation, entry/stake debit, minimum stake, side totals, close deadline.
- [ ] Audit proportional Pool Court distribution, rounding/remainder handling, losing-side outcome, and duplicate settlement protection.
- [ ] Audit cancellation/refunds and reserve release consistency.
- [ ] Add automated tests for critical Court and settlement paths.

## Wallet and reward integrity
- [ ] Verify every CT/SETHIS mutation is atomic with ledger and idempotency reference.
- [ ] Exercise wallet integrity audit against seeded scenarios and correct false positives/omissions.
- [ ] Verify welcome gift, Admin grant, Court entry/debit, Court reward, Pool stake/prize/refund, task/referral/ad credits.
- [ ] Confirm balances cannot be changed through client-supplied values or unauthenticated requests.

## Tasks, referrals, ads
- [ ] Verify task catalog/UI rewards match actual claim/review/credit logic.
- [ ] Test social task submission, admin review, approved credit, rejected resubmission and duplicate prevention.
- [ ] Test referral deep link attribution, self-referral/duplicate prevention, onboarding+gift qualification, 3-referral milestone and exactly-once 500 SETHIS.
- [x] Installed Monetag SDK main zone `12269852` in `index.html`; retained the existing React SDK path and server-only valued-event rewards. (Production secrets/postback URL and live ad verification still require dashboard setup.)
- [x] Improved rewarded-ad confirmation UX and wallet/status refresh retries after SDK confirmation.
- [ ] Configure Monetag postback URL + private secret; test valued events, unique IDs, shared 20-minute cooldown, Lagos daily cap 30 and placements (100 CT Home / 150 SETHIS Tasks).
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
