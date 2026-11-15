# Phase One — Remaining Implementation Tracker

This file is the live checklist for completing Phase One. Preserve the approved UI; implement missing behavior and fix defects behind it.

## Courts and settlement
- [x] Fixed argument reactions missing `closes_at` in their Court lookup; reactions now enforce the Court deadline. Audited join, argument, reply and reaction paths for active membership, Court deadline, content visibility, duplicate submission and rate-limit checks.
- [x] Guarded Regular Court reward wallet/ledger credits against a conflicting duplicate verdict by requiring the recorded adjudication's winning side to match the payout side.
- [x] Guarded the Regular Court status/outcome update and API confirmation against a conflicting concurrent verdict; the displayed Court outcome must now match the immutable adjudication record.
- [x] Extended the wallet integrity audit to detect Regular and Pool Court outcome fields that disagree with their immutable adjudication records.
- [x] Moved Regular and Pool Court entry deadline checks into the same database statements that create the CT debit, closing a race where a late request could pass an earlier status check.
- [x] Added safe cancellation for scheduled Pool Courts; pending reserves need no release attestation, while secured reserves require a release reference and explicit confirmation.
- [x] Exposed Pool Court reserve-attestation state in the member UI so a scheduled pool with an unconfirmed reserve is labelled as a proposed prize and cannot be mistaken for an open, funded pool.
- [x] Audited Admin editorial verdict flow: immutable one-per-Court adjudication, matching-side settlement, idempotent fixed winner reward, participant status/history and verdict notifications. Concurrent duplicate-settlement requests have now been exercised against staging D1; the automated SQLite tests also cover replay and conflicting verdicts.
- [x] Audited Pool Court scheduled/open/locked/settled/cancelled lifecycle, reserve attestation, open/close windows, minimum stake, side totals and locked-before-verdict rules. Stake transaction now independently requires a secured reserve; future opening times are labelled scheduled in the member feed.
- [x] Preserved proportional Pool Court distribution with deterministic largest-remainder allocation; the adjudication now records the count of participants who actually receive a positive SETHIS credit, keeping zero-value rounding outcomes from falsely failing the ledger audit.
- [x] Guard Pool Court adjudication, prize credits, position settlement and verdict notifications so they can only run against the matching locked-to-settled adjudication; guarded Regular Court verdict notifications against cancelled/unsuccessful settlement races. (Simultaneous duplicate settlement batches have now passed against staging D1.)
- [x] Audited losing-side settlement and duplicate protection: all positions settle, only positive winning allocations are credited, adjudication is unique and wallet credits require the matching settled winner. Same-side duplicate settlement requests and conflicting verdict replays are covered by automated SQLite tests and staging D1 concurrency checks.
- [x] Audited Regular and Pool cancellation/refund batches: cancellation state gates credits, idempotency keys prevent repeat refunds, participant/position state changes require the refund ledger, and secured Pool reserves require a recorded release reference. Pool cancellation/refund and reserve-release idempotency were exercised against staging D1; real Admin UI execution remains pending.
- [x] Added Node built-in unit tests for proportional Pool Court allocation, deterministic remainder distribution, zero-value outcomes, tie-breaking, prize conservation across uneven stakes, safe-integer arithmetic and invalid input; the seven allocation tests were executed locally under Node 22; the main-branch verification workflow also runs the complete test suite.
- [x] Expanded Telegram initData tests for missing tokens, oversized payloads and the exact 24-hour expiry boundary.
- [x] Extracted HTTPS-only URL validation used by editorial evidence, social-task destinations/proof and image/source links; added tests for accepted HTTPS URLs and rejected schemes/invalid input (38 automated tests now cover Pool allocation/settlement, Regular Court settlement/refunds, task-review race safety, rankings, URL validation, Telegram authentication, Lagos check-in, Monetag idempotency and Admin setup guard; the latest full Cloudflare build passed under Node 22.23.5).
- [x] Validated the revised Regular/Pool settlement SQL statements against production D1 using read-only EXPLAIN queries; no production rows were changed.
- [x] Exercised critical transaction SQL against the separate `sethis-phase-one-test` D1 database: welcome gift credits exactly once, check-in uniqueness holds, referral qualification reaches three and credits exactly 500 SETHIS once, Pool staking is blocked while reserve is pending, duplicate Pool stake rolls back without a second debit, and cancellation returns CT/releases the reserve exactly once. No production rows were changed.
- [x] Issued simultaneous duplicate settlement batches against staging D1 for Regular Court and Pool Court: both requests completed, only one adjudication was stored, winner rewards were credited once, losing-side balances stayed unchanged, and notifications were deduplicated.
- [ ] Convert the remaining manual staging scenarios into repeatable automated D1 tests; automated SQLite transaction tests already cover Court/Pool settlement and task-review races.

## Wallet and reward integrity
- [x] Source-audited every Worker wallet balance mutation: welcome gift, admin grant, task/referral/ad reward, Court entry/reward/refund and Pool stake/prize/refund are batched with ledger/idempotency checks.
- [x] Expanded the production wallet integrity audit to 32 checks, including orphaned Court/Pool CT debits and refunds, ineligible Court/Pool prize recipients, proportional Pool prize bounds, orphaned task/referral credits, and agreement between Court outcome fields and immutable adjudication records.
- [x] Executed all 32 wallet integrity checks read-only against production D1; every check returned zero issues. Production currently has no wallet entries, Regular Court participants, Pool positions, task claims or referrals, so representative transaction scenarios were exercised separately in staging. The staging audit's nonzero findings were traced to deliberately synthetic/incomplete test fixtures; no production rows were changed.
- [x] Verified welcome gift, Admin CT grant, referral milestone, Pool stake/reserve gate, duplicate stake rollback, Pool refund/reserve release and Regular Court entry against the separate staging D1 database; Regular Court fixed-reward settlement, Regular Court cancellation/refunds and Pool proportional prize settlement now have automated SQLite transaction tests. Task approval has now been exercised in staging D1; the real Monetag provider callback remains to be exercised.
- [x] Confirmed there is no client balance-setting API; wallet mutations require verified Telegram identity, an authenticated Admin session or the secret-verified Monetag postback, with server-side amounts and transaction checks.

## Tasks, referrals, ads
- [x] Compared production task catalog with member UI and server rewards: Telegram 150, Facebook 100, WhatsApp 70, invite-three milestone 500 SETHIS; ad placements remain 100 CT Home / 150 SETHIS Tasks. Referral milestone is server-settled rather than a manual claim.
- [ ] Add the owner-supplied social destinations; those rows remain hidden until valid HTTPS links are configured.
- [x] Improved task-claim duplicate handling so already-pending and already-approved tasks return accurate conflict responses instead of reporting a false new submission.
- [x] Require a configured official destination and an HTTPS proof link before accepting manual social-task claims; the Admin review queue displays the submitted evidence link.
- [x] Verified staging social-task claim submission, duplicate pending-claim preservation and rejected-claim resubmission with fresh HTTPS evidence.
- [x] Tested server-side task approve/reject transitions, reward ledger idempotency and stale-review races with automated SQLite tests and staging D1.
- [ ] Test the full Admin task-review UI, audit trail and post-review member state using the authenticated production Admin session.
- [x] Made referral qualification retry-safe: repeat welcome-gift confirmation now rechecks an eligible invitee and can complete a missed qualification/milestone after a partial failure, without double-crediting the inviter.
- [x] Verified the onboarding+welcome-gift qualification condition and exactly-once 500 SETHIS milestone using three separate synthetic invitee identities in staging D1.
- [x] Verified staging first-login referral attribution, self-referral rejection and immutable first-inviter attribution on subsequent logins; the three-invitee milestone was separately verified.
- [ ] Test real Telegram `start_param` referral deep links and qualification with multiple Telegram accounts.
- [x] Configured the Monetag main zone `12269852` and private postback secret as Cloudflare Worker secrets; confirmed both secret bindings exist on the production Worker (values are not readable through Cloudflare secret metadata).
- [x] Standardized on the React `monetag-tg-sdk` package as the sole SDK loader; removed the duplicate HTML SDK script tag.
- [x] Improved rewarded-ad confirmation UX: distinguish valued, non-valued and pending server postback outcomes; removed stale Wallet copy that always claimed setup was pending.
- [x] Implemented server-side reward validation for `valued` events only, main-zone validation, placement validation, unique `ymid` idempotency, one reward per user per 20 minutes, Lagos daily cap 30, and 100 CT Home / 150 SETHIS Tasks rewards.
- [x] Owner confirmed the complete Monetag SSP main-zone Postback URL has been entered. The external Monetag dashboard configuration cannot be independently inspected from the connected Cloudflare account.
- [ ] Run the real valued-ad credit test inside Telegram and confirm exactly one wallet credit; owner plans to do this after the build is ready.

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
- [x] Verified sequential onboarding progress through all seven steps, completion timestamp and profile fields persist in staging D1.
- [x] Added Worker-level integration coverage using three independently signed synthetic Telegram identities against an isolated SQLite database: sign-in persistence, profile isolation/validation, ordered seven-step onboarding, exactly-once welcome gift, duplicate daily check-in, notification read state, referral attribution/qualification, Court entry debits, outsider membership denial, duplicate join/argument rejection, cross-member arguments/replies/reactions, report deduplication and participant-specific notifications. The suite also verifies restricted-member posting/reply/reaction denial and that hidden arguments disappear from reply queries and reject new reactions/reports. The full suite passes (43/43) and the Worker/application build passes; real Telegram account testing remains pending.
- [x] Verified notification event-key deduplication and read-state transition in staging D1.
- [ ] Test onboarding resume/completion, profile and check-in persistence, and notification event creation with real Telegram accounts.
- [x] Verified in-app notification event creation for arguments, replies and reactions in staging D1; wallet, referral, task, Regular Court and Pool Court verdict notifications are covered by staging checks or automated transaction tests. Notification event-key deduplication and read-state transitions were also verified in staging.
- [ ] Confirm notification visibility and read-state behavior with real Telegram accounts.
- [x] Verified staging moderation-report uniqueness: duplicate open reports are rejected and a new report can be submitted after dismissal.
- [x] Verified the member reply query excludes replies whenever the parent argument or its Court is hidden.
- [x] Verified staging Admin moderation actions across all report target types: Court, argument and reply content was hidden/restored; user restriction was saved; reports were actioned; and audit-log entries were recorded.
- [ ] Test the Admin moderation queue and report target variants (users/Courts/arguments/replies) in the UI, then verify restrictions are enforced during real Telegram actions.
- [x] Added server-side community limits: 20 arguments/hour, 60 replies/hour and 10 reports/hour per user; identical argument/reply submissions within two minutes are rejected, and restricted users cannot react.
- [x] Enforced Court visibility/moderation status in join, argument, reply and reaction paths so hidden/removed Courts cannot be modified through direct API requests.
- [x] Enforced parent/target moderation visibility for replies and reactions, and excluded hidden replies from member reply lists and visible reply counts.
- [x] Added supporting rate-limit indexes in migration `0020_community_rate_limits.sql` and applied those indexes to production D1; validated the three guarded INSERT statements with read-only SQL EXPLAIN.
- [ ] Complete real Telegram multi-user tests for the new limits, duplicate handling and moderation enforcement.

## Rankings and history
- [x] Implemented rankings with the documented wins → win rate → SETHIS earned → entries tie-break order, a stable row-number rank, and an authenticated member's own rank even when outside the top 100.
- [x] Connected homepage SETHIS earned and member rank figures to ledger-backed and settled-outcome data instead of fixed placeholder dashes.
- [x] Validated the rankings SQL and wallet/reward/refund/check-in transaction statements against production D1 with read-only EXPLAIN checks; no fixture rows were written.
- [x] Added automated SQLite tests using the actual extracted rankings SQL and representative Court/Pool records; verifies combined wins, win rate, SETHIS earned, entry counts, deterministic user-ID tie-breaks, exclusion of unresolved-only users and authenticated own-rank visibility outside the top 100.
- [ ] Test the Rankings and My Courts screens with real Telegram participants and verify the displayed data against their actual histories.

## Admin Portal security
- [x] Locked first-admin creation behind the owner-only `ADMIN_SETUP_SECRET`, compared in constant time; the Admin Portal asks for the one-time key and refuses setup when the Worker binding is absent.
- [x] Added SQLite-backed tests against migration `0023_admin_setup_guard.sql` for unauthorized first-admin creation, successful short-lived authorization consumption and expired authorization rejection. Production D1 already contains one administrator record, so first-admin registration is currently closed.
- [x] Rate-limited first-admin setup attempts to five per IP hash per 15 minutes using the same atomic limiter as Admin sign-in.
- [x] Require same-origin requests for all Admin and editorial write endpoints, in addition to the HttpOnly, Secure, SameSite=Strict session cookie.
- [x] Added the `ADMIN_SETUP_SECRET` secret binding, `admin_setup_authorizations` table and a D1 trigger that rejects first-admin inserts without a short-lived authorization row. The new Worker creates that row and the admin record in one atomic batch. The latest main revision has now been deployed to production through Cloudflare Workers Builds; deployment version `9e45c60f-c9c0-4934-88d5-c4763bc2fd2d` is receiving 100% traffic.
- [x] Added an authenticated, read-only Admin audit-history API and a dedicated Admin Portal screen showing recent task-review, moderation, content-action and member-restriction records; live Admin-session UI verification remains pending below.
- [x] Exposed task-claim reviewer/time metadata and moderation review notes/timestamps in the Admin queues; successful review and moderation actions now refresh the audit history. Automated UI/build verification is pending the current workflow run.
- [x] Added server-side failed-login throttling: five attempts per IP hash within 15 minutes, reserved atomically so concurrent requests cannot bypass the limit, generic credential errors, successful-login reset, and automatic cleanup of expired attempt records.
- [x] Added migration `0022_admin_login_rate_limits.sql` and applied the table/index to production D1; validated the login rate-limit SQL with read-only EXPLAIN checks.

## Launch validation
- [x] Added a GitHub Actions verification workflow to run `npm test` and `npm run build` on pushes to `main` and pull requests.
- [x] Confirmed Cloudflare Workers Builds is configured for `main`; its build step now runs `npm test && npm run build`. The production deploy command has been restored to `npx wrangler deploy`; the latest main revision built and deployed successfully. GitHub Actions is kept focused on verification.
- [x] Verified the full Cloudflare Workers Build for latest main source revision `59f2172f92e4c6e999f3e56308bb994e1ce8c679`: all 38 automated tests passed, TypeScript/Vite production build passed, and Wrangler deployed the Worker successfully.
- [x] Created and used the separate `sethis-phase-one-test` D1 database for synthetic staging fixtures covering wallet credits, referral qualification, Court/Pool entries, Pool refunds, task claims/rewards, moderation reports, hidden-content filtering, onboarding, notifications and check-ins. Automated SQLite transaction tests cover settlement and race conditions.
- [x] Confirmed production deployment version `9e45c60f-c9c0-4934-88d5-c4763bc2fd2d` is receiving 100% traffic.
- [ ] Run Telegram multi-user test: onboarding, join, argue/reply/react, verdict, reward, wallet, rankings, report.
- [ ] Check mobile errors/loading/empty states and production logs.
- [ ] Complete security review and beta readiness checklist.

## External configuration / owner inputs
- [x] Monetag main Zone ID and private postback secret are configured as production Worker secret bindings.
- [x] Owner confirmed the complete Monetag SSP postback URL has been entered.
- [ ] Run the real valued-ad credit test later, after the Phase One build is ready.
- [ ] Official Telegram channel, Facebook page and WhatsApp community URLs.
- [ ] Telegram BotFather Menu Button and bot avatar confirmation.
