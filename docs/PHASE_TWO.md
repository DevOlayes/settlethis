# Settle This! — Phase Two Development Plan

## Goal

## Current implementation status — 16 November 2026

Completed and deployed:
- Admin-managed fixture catalogue and fixture-to-Match-Court linking.
- Fixture-aware Match Court publishing with kick-off-based opening.
- Admin-controlled match lifecycle transitions: scheduled → live → half-time → live → full-time, with postponement/cancellation handling.
- Manual score and match-minute updates synchronised to linked Match Courts and recorded in the administrator audit log.
- Member-facing scheduled kick-off information and pre-kick-off join restrictions.
- New fixtures are required to start in the scheduled state.

- Match poll database foundation: fixture-/Court-linked half-time and match-moment polls, normalized options, and a database-enforced one-vote-per-member constraint.
- Secured Admin APIs to schedule polls, enforce valid voting windows, close/cancel polls and record poll-management audit events.
- Member Match Court poll interface with eligibility checks, vote submission and aggregate results. Scheduled polls transition to open/closed when their configured time windows are reached and a poll feed is requested.

Not yet connected:
- Automatic live score/status ingestion from a trusted football-data provider. No provider credentials or feed are configured, so the platform does not invent match events or change a match to live merely because its scheduled kick-off time has arrived.
- Poll-opening notifications are now generated in the existing member notification inbox for active participants in the linked Match Court. Notification event keys are idempotent per poll/member, and the inbox refreshes periodically while the Mini App is open. Poll windows still transition when the Worker processes a poll or notification request; there is no background scheduler or Telegram push message. Half-time events are not automatically inferred from manually maintained fixture status.
- Football quiz data model: daily and fixture-linked quizzes, multiple-choice and true/false questions, scheduled windows, configurable SETHIS reward/pass mark, one attempt per member and stored answer history. Migration 0029 is applied to production D1.
- Admin quiz management: create and review drafts, inspect answer keys, publish, close and archive quizzes; unpublished drafts can be deleted. Publishing validates question count, option count and exactly one correct answer per question.
- Member quiz hub in Tasks: upcoming/live/closed/completed quiz states, answer selection, one-attempt submission, score and explanation review.
- Server-side quiz scoring and reward settlement: Worker validates the full answer set and current quiz window, calculates score, applies the configured pass mark, records attempts/answers and credits SETHIS through an idempotent `quiz_reward` ledger entry with a member notification.
- Quiz rewards are included in wallet integrity checks, member SETHIS-earned totals and leaderboard earnings.
- Production build and Worker deployment completed on 16 November 2026 (Worker version `73fe583f-6d0e-438a-8f59-d4f36f9d9b18`). No live app tests or test suites were run; final verification remains deferred until all phases are complete.


Expand Settle This! from its core Court experience into a richer football-entertainment destination that gives members more reasons to return around live football, play football knowledge games, and explore their history.

Phase Two builds on the Phase One Court, identity, moderation, notification and wallet foundations. It does not replace the existing product model or turn Settle This! into a generic forum, betting app, fantasy game or open creator platform.

## Product rules carried forward

- Keep the Telegram Mini App as the primary member experience.
- Preserve the approved Midnight Navy, Deep Slate, Raised Slate, Electric Cyan, white and restrained Stadium Gold visual system.
- CT remains the Court-entry/activity currency; SETHIS remains the reward token. Never silently merge the two balances.
- Any reward must be earned through a server-verified, auditable ledger transaction. Never trust client-submitted scores, outcomes or reward amounts.
- Do not introduce XP, generic reputation points, NFTs or fake engagement counters.
- Keep platform-created Courts as the default. Any future host publishing must be permissioned and moderated, not unrestricted public posting.
- Keep the interface compact, mobile-first and football-specific.

## Phase Two workstreams

### 1. Matchday experience

- Add fixture-linked Match Courts that can be scheduled ahead of kick-off and progress through scheduled, live, half-time, full-time and archived states.
- Add live-match discussion/engagement around the existing Court model rather than creating a disconnected generic chat product.
- Add half-time and match-moment polls with clear open/close times, one eligible vote per member per poll, visible aggregate results and server-side vote integrity.
- Link each Match Court to its fixture, teams, competition, kick-off time and match status.
- Provide a useful match archive so completed Match Courts remain discoverable.

### 2. Football quizzes

- Introduce daily and fixture-linked football quizzes.
- Support question formats such as single-answer multiple choice and true/false first; keep question and answer content manageable by Admin.
- Score attempts on the server, prevent duplicate reward claims, and record quiz history.
- Make any SETHIS reward amount configurable and visible before a member starts. Do not reward unverified client-side scores.
- Quizzes must be fully functional before being surfaced; no sample or placeholder quiz cards.

### 3. Football coverage and discovery

- Extend competition/league coverage beyond the initial content set through a structured competition and fixture catalogue.
- Add filters for competition, country, team and match status where they improve discovery.
- Keep expansion data-driven so adding a competition does not require redesigning the app.
- Do not imply live scores or automatic fixture feeds until a trusted data source is selected and configured. Admin-managed fixture content is the initial supported path.

### 4. Deeper member history and football statistics

- Expand My Courts and member profiles with useful, ledger-/outcome-backed history: participation by Court type, settled outcomes, quiz performance and matchday participation.
- Add historical views and meaningful filters without inventing statistics or presenting unresolved Courts as wins.
- Keep ranking and achievement logic transparent; no XP or reputation currency.

### 5. Controlled host/editor workflow

- Prepare a permissioned workflow for trusted hosts/editors to propose or manage matchday content under Admin moderation.
- Preserve Admin control over publishing, content quality, eligibility, deadlines and rewards.
- Do not enable unrestricted user-created Courts or open creator publishing in this phase unless moderation safeguards are fully designed and approved.

## Suggested implementation order

1. Matchday data model and Admin-managed fixture management.
2. Match Court lifecycle and member-facing match discovery/detail.
3. Half-time/match-moment polls, vote integrity and notifications. (Implemented and deployed.)
4. Quiz data model, Admin question management, member quiz flow and server-side scoring. (Implemented and deployed.)
5. Expanded competition discovery and historical archives.
6. Member statistics/history improvements.
7. Permissioned host/editor workflow, only after the moderation model is complete.

## Phase Two acceptance criteria

- Admin can create and manage a fixture and its Match Court content without editing source code.
- Members can discover a fixture, open its Match Court, participate in the correct match state and return to its archive.
- Poll windows are enforced by the Worker/database; one member cannot vote more than once where the poll is single-vote.
- Poll totals are derived from stored votes, not client-supplied counters.
- Admin can create, schedule, publish and close quizzes and manage question/answer content.
- Quiz scores are calculated server-side; attempts and reward credits are idempotent and auditable.
- Member history and statistics are sourced from actual records and clearly distinguish pending from settled outcomes.
- All new member-facing features use the existing Telegram identity, authorization, moderation, notification and wallet foundations.
- No production deployment or external live-service testing occurs during development. Final real-world testing is reserved until all planned phases are complete.

## Explicitly not part of Phase Two

- Native Android/iOS applications.
- Crypto deposits, withdrawals, exchange listings, token trading or guaranteed monetary value for SETHIS.
- Unrestricted public user-created Courts.
- Unverified live-score/fixture integrations.
- NFT collectibles, XP or generic reputation systems.

These may be reconsidered as later-phase work only through an explicit product decision.
