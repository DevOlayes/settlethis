> **DATED SECURITY REVIEW — NOT A LIVE RELEASE CHECKLIST.** This review records a previous implementation snapshot and contains references to retired Courts/Pool Courts and earlier release assumptions. Do not treat its old outstanding items, counts, or product descriptions as current without re-verification. The current product specification is [PRODUCT_DIRECTION.md](PRODUCT_DIRECTION.md). Reconfirm security controls and release checks during the final production review.

# Security Review — Phase One

Review date: 2026-11-15  
Review scope: Telegram Mini App, Cloudflare Worker/D1, browser Admin portal, wallet/reward flows and external links.

## Controls verified in code

### Telegram identity
- Mini App initData is verified server-side with Telegram's WebAppData HMAC-SHA-256 scheme.
- Payloads are capped at 8 KB, signatures are compared without early character exits, timestamps must be safe integers within the 24-hour validity window (with at most 60 seconds of future skew), and Telegram user IDs must be positive safe integers.
- User-facing write routes derive the acting member from verified Telegram initData; client-supplied user IDs are not used as the authorization identity.

### Browser Admin
- First-admin setup requires the owner-only Worker secret and a short-lived D1 authorization row enforced by a database trigger.
- Admin passwords use PBKDF2-SHA-256 with a random 16-byte salt and a bounded stored work factor.
- Admin sessions use 256-bit random tokens stored as SHA-256 hashes; the cookie is Secure, HttpOnly, SameSite=Strict, path-scoped and expires after seven days.
- Admin writes require an exact same-origin Origin header and a valid server-side session.
- Failed sign-in and first-admin setup attempts are limited to five per IP hash per 15 minutes. Rate-limit IP identifiers are HMAC-peppered with a Worker secret.
- Unknown Admin email addresses perform a dummy password hash to reduce account-enumeration timing differences. Login errors are generic; setup failures no longer return internal stage/error details.

### Member authorization and abuse controls
- Member records, wallet reads, referrals, task claims, notifications and My Courts data are scoped to the verified Telegram user.
- Notification read operations are user-scoped and have automated cross-account isolation coverage.
- Community limits: 20 arguments/hour, 60 replies/hour and 10 reports/hour per member. Pool Court invitation creation is limited to five links per member per Pool Court per hour.
- Pool invite start_param acceptance is tested with separate synthetic Telegram identities; invite codes are case-insensitive for legacy links, self-invites are rejected, and replayed acceptance is idempotent.
- Suspended members cannot perform member write actions other than submitting abuse reports; restricted members cannot publish arguments/replies or react. Hidden/removed Courts and content are excluded from public reads and guarded in write routes.
- Reports support Courts, arguments, replies and members; member reports resolve public usernames server-side without exposing Telegram numeric IDs.

### Wallet and rewarded ads
- Wallet changes are server-side; there is no client balance-setting endpoint.
- Court, Pool, task, referral, welcome, Admin grant and Monetag credits use ledger/idempotency checks.
- Monetag rewards require a secret-verified, main-zone, valued event with a valid event ID, known Telegram user and supported placement. Amount/token mapping, shared cooldown, daily cap and exactly-once crediting are server-controlled.
- The Admin wallet audit now runs 36 checks. All 36 read-only checks returned zero issues against production D1. Staging findings are limited to known synthetic/incomplete fixtures.

### Input and response hardening
- External URLs require HTTPS and reject embedded credentials. Social task URLs are additionally restricted to the matching Telegram, Facebook or WhatsApp host allowlist.
- Telegram bot usernames are validated before constructing referral or Pool invite links.
- API JSON and static asset responses set nosniff, frame denial, strict referrer policy, restrictive camera/microphone/geolocation permissions, HSTS and legacy cross-domain policy headers. API JSON responses are no-store.
- SQL values are parameter-bound; dynamic table names and wallet fields are selected from fixed allowlists.

## Remaining release checks

- A report-only Content Security Policy baseline is now attached to static responses. A strict policy is not yet enforced: the Monetag npm SDK dynamically injects its ad script, so inspect browser CSP reports during final Telegram/Monetag testing and confirm every required production script, connection and frame origin before enforcement.
- The repository does not yet contain a committed package-lock.json. The CI dependency audit passes, but dependency resolution is not fully reproducible; generate and commit a lockfile before the production release.
- Run the final real Telegram multi-account journeys only after implementation is complete, including onboarding, profile, check-in, reports/moderation, Court/Pool actions, notifications, referrals and wallet history.
- Run one real Monetag valued-event callback inside Telegram and confirm exactly one ledger credit.
- Verify the Admin portal in a real authenticated browser session, including moderation, task review, social destination editing and audit history.
- Migration 0024_pool_invite_rate_limit.sql has been applied to staging D1 and its covering-index query plan verified. Apply it to production only as part of an explicitly approved release.
- The pull-request verification workflow now runs npm audit at high severity; the latest successful run passed dependency audit, automated tests and the TypeScript/Vite build.
- Do not merge or deploy this draft branch without the owner's explicit approval.

## Verification notes

The GitHub pull request is draft-only. Automated tests and builds run through the pull-request workflow. No real Telegram accounts or phone-based end-to-end tests have been used during this implementation pass.


## CSP review — development-stage decision (2026-11-16)

- The deployed static response currently uses a **report-only** policy; it does not block resources. This is intentional while the Telegram Mini App and Monetag SDK have not undergone final real-device/browser integration testing.
- Source review confirms the HTML loads Telegram Web Apps from `https://telegram.org/js/telegram-web-app.js`; the React Monetag integration is provided by `monetag-tg-sdk` and the previously observed SDK script host is `https://yoszi.com`.
- The current report-only baseline allows same-origin scripts plus Telegram and yoszi.com, inline styles, Google Fonts, HTTPS images/connections/frames, and data/blob media. It denies objects, restricts base/form targets, sets frame ancestors to none, and upgrades insecure requests.
- **Do not convert this to an enforcing CSP during feature development.** We have no verified browser CSP violation report from the real Telegram/Monetag runtime. Broad HTTPS connection/frame allowances are deliberately temporary and are not a claim of least-privilege CSP.
- Final CSP work: capture report-only violations on supported Telegram clients and the Admin browser; identify each required script/connect/frame origin; remove unnecessary broad HTTPS allowances; confirm SDK behavior; then enforce and re-check the full user journey in the final testing phase.
- Lockfile remains outstanding: `package-lock.json` is absent. Generate it with npm in a network-enabled Node 22 environment, commit it to `main`, and confirm a clean reproducible install/build. The current connected GitHub/Cloudflare actions do not provide a package-lock generation operation; do not fabricate dependency resolution data.
