> **HISTORICAL / SUPERSEDED:** This plan documents the previous Courts-and-debate product concept. The current member product is SETHIS Football Games, with Guess Who? / Mystery Footballer as the first featured game. Do not use this document as the active roadmap. See [Current Product Direction](PRODUCT_DIRECTION.md).

# Settle This! — Phase Three Expansion & Monetisation Plan

## Goal

Grow Settle This! from its core Court and matchday experience into a distinctive football-entertainment destination with sustainable revenue, stronger repeat engagement and wider football coverage.

Phase Three must strengthen the existing product rather than turn it into a generic social network, betting product, open creator marketplace or ad-wall app.

## Product decisions carried forward

- Telegram Mini App remains the primary member experience.
- Preserve the Midnight Navy, Deep Slate, Raised Slate, Electric Cyan, white and restrained Stadium Gold visual system.
- CT remains the Court/activity currency. SETHIS remains the main reward token. Their balances, ledger entries and purposes must remain distinct.
- Monetag rewarded ads remain a bounded optional reward channel, not the central product or the only monetisation strategy.
- No guaranteed cash value, exchange value, deposits, withdrawals or trading claims for SETHIS.
- No NFTs, generic XP, generic reputation points or artificial engagement counters.
- No unrestricted public creator publishing. Admin retains commercial, editorial, moderation and reward controls.
- Any commercial placement must be clearly identified as sponsored or affiliate content. Editorial verdicts and community outcomes must never be purchasable.
- Keep the product football-first, mobile-first, compact and useful even when no sponsor or affiliate campaign is active.

## Phase Three workstreams

### 1. Commercial foundations and sponsorship

Build the controlled foundations for direct commercial partnerships.

- Define sponsor inventory around relevant football surfaces: selected competitions, matchday experiences, branded debate/Court series and clearly separated sponsor placements.
- Give Admin control to create, schedule, pause and end campaigns, set placement and dates, and review delivery.
- Clearly label sponsored content. Keep sponsor messaging separate from Court questions, arguments, votes, verdicts and editorial decisions.
- Record eligible impressions and clicks using server-side event validation, deduplication and basic abuse controls.
- Provide campaign-level reporting that distinguishes delivery from clicks and does not present unverified events as revenue.
- Do not invent sponsor contracts, prices, campaign commitments or partner integrations. External partner onboarding and billing require explicit owner approval.

### 2. Affiliate commerce

- Support carefully selected football-relevant affiliate recommendations and links.
- Admin controls the catalogue, destination URL, campaign dates, disclosure text and placement.
- Validate HTTPS destinations and record outbound clicks without exposing member identity to affiliate destinations.
- Clearly disclose affiliate relationships before a member follows a link.
- Keep recommendations useful and editorially independent; affiliate commission must not influence Court outcomes or football verdicts.
- Do not add checkout, payment collection or product inventory management unless separately approved.

### 3. Distinctive football-entertainment formats

- Explore a recurring “Settle the Argument” / football-court entertainment format built around a strong football question, opposing cases and a community-wide verdict.
- Create repeatable editorial formats such as football controversies, hot takes, match moments and “football cuts” that can be produced by the platform's editorial team.
- Make participation and the community verdict the centre of the experience, not individual creator popularity.
- Keep the existing Court model and moderation safeguards. Do not introduce unrestricted user-created Courts or creator monetisation.
- Validate the format through editorially managed content before adding more complex mechanics.

### 4. Community participation and supporter identity

- Explore optional CT-powered participation effects or reactions that add visible value to a Court without buying influence over its verdict.
- If a paid/CT-powered action is introduced, disclose its cost and effect before confirmation, enforce server-side eligibility and limits, and record it in the ledger.
- Community votes and editorial outcomes must remain one-member/one-eligible-vote where applicable; spending CT must never increase a member's voting weight.
- Introduce supporter identity markers or club-supporter insignias only where they are earned, verified or clearly cosmetic. They must not become NFTs, transferable assets or a generic XP system.
- Any new CT sink must be modelled against earning rates, balances, abuse risks and accessibility before release.

### 5. Competition and regional expansion

- Expand supported competitions, countries, teams and seasons through the existing structured catalogue.
- Keep fixture creation and lifecycle management reliable when no external data provider is configured.
- Add languages or regional experiences only with a clear content and moderation plan.
- Do not claim live coverage or automatic data ingestion until a trusted provider is selected, configured and validated.

### 6. Token and reward ecosystem — future-gated

- Preserve the CT / SETHIS distinction and existing ledger integrity.
- Explore additional ways to earn or use SETHIS only where there is a clear product purpose, transparent eligibility and abuse prevention.
- Any crypto, tokenization, airdrop, wallet-connect, exchange or cash-conversion feature is explicitly outside this implementation plan until separately researched and approved by the owner.
- Never imply that SETHIS has guaranteed monetary value.

## Recommended implementation order

1. **Commercial inventory and Admin controls:** define campaign and placement records, disclosure rules, scheduling, pause/end controls and audit history. Start with the data model and Admin workflow; do not expose empty sponsor slots to members.
2. **Measurement foundation:** add deduplicated, privacy-conscious impression/click events and Admin reporting. Keep delivery metrics distinct from confirmed commercial revenue.
3. **Affiliate catalogue:** Admin-managed football-relevant links, disclosures, destination validation and click reporting.
4. **Settle the Argument editorial format:** create reusable, platform-managed football-entertainment formats using the existing Court and moderation foundations.
5. **Supporter identity and CT participation:** only after the mechanics, costs, fairness rules and ledger impact have been reviewed and approved.
6. **Competition/region expansion:** extend the existing catalogue and editorial operations without implying unsupported live-data coverage.
7. **Future token ecosystem research:** discovery only until the owner explicitly approves a separate scope.

## Phase Three acceptance criteria

- Admin can manage commercial campaigns and placements without editing source code.
- Sponsored content is visibly disclosed and cannot alter editorial decisions, member votes, Court verdicts or rewards.
- Campaign metrics are deduplicated, auditable and clearly labelled as measured activity rather than revenue.
- Affiliate links are Admin-controlled, HTTPS-validated and clearly disclosed; member identity is not appended to outbound URLs.
- Commercial features remain absent from member surfaces when no active campaign or approved content exists.
- New football-entertainment formats reuse the existing Court, moderation, notification and audit foundations.
- CT-powered interactions, if approved, cannot buy voting power or editorial influence and must use the existing server-side ledger.
- Supporter identity markers do not introduce NFTs, XP or generic reputation.
- Competition expansion reuses the existing fixture/competition catalogue and does not fabricate live match data.
- Every feature is committed directly to main and deployed through Cloudflare Workers Builds. Production builds may be run during development.
- No live app tests, external-provider tests, authenticated production UI tests or automated test suites are run until all planned phases are complete.

## Explicitly out of scope unless separately approved

- Betting, odds, sportsbook or gambling mechanics.
- Guaranteed monetary value, exchange listings, token trading, deposits or withdrawals.
- NFT collectibles or transferable tokenized badges.
- Open creator publishing, creator payouts or unrestricted public Courts.
- Selling votes, verdicts, rankings or editorial influence.
- Ad-first experiences, forced ad viewing or paywalls that block the core Court experience.
- Unverified live-score or fixture-data integrations.
- Sponsor billing, payment processing or contractual pricing assumptions.

## Phase Three decisions to confirm during implementation

- Which sponsor placements are acceptable and which member screens must remain sponsor-free.
- Initial affiliate categories and the disclosure wording.
- The first “Settle the Argument” editorial format and publishing cadence.
- Whether supporter insignias are earned, verified or purely cosmetic.
- Whether any CT-powered participation effect is worth introducing after fairness and ledger analysis.
- Which additional competitions, countries and languages should be prioritised.

These decisions must be explicit before a related member-facing feature is enabled.


## Component 3 implementation record — Affiliate commerce

Implementation scope completed and deployed:
- Admin-managed affiliate catalogue with controlled football categories: shirts and kits, boots and equipment, books and media, fan experiences, and football services.
- Draft-first creation, editing, scheduling, activation, pause, resume, end and archive controls.
- HTTPS-only destination and optional image validation; no credentials or non-standard ports accepted.
- Required disclosure text containing explicit affiliate or commission wording.
- Approved placement selection reuses the existing commercial placement catalogue and respects disabled placements.
- Member-facing recommendation cards appear only for eligible active items and never leave empty placeholders.
- Clear affiliate disclosure appears before the outbound action.
- Outbound click events are server-validated, deduplicated by temporary session/item/placement/day, and rate-limited using the existing short-lived privacy-preserving IP digest mechanism.
- Outbound URLs are used as supplied by Admin; no member identity, Telegram ID, session key or other member data is appended or forwarded. Referrer information is suppressed.
- Admin catalogue shows item status, placements, schedule and measured outbound click totals; changes are recorded in the Admin audit log.
- No checkout, payment collection, inventory management, affiliate-network integration or revenue attribution is included.

Final production validation remains deferred until all planned Phase Three components are implemented. No live app journeys or automated test suites are run during feature development.


## Component 4 implementation record — Settle the Argument

Implementation scope completed and deployed:
- Added an editorially managed episode catalogue linked to existing visible, published Courts. An episode never creates a duplicate Court or changes entry costs, reward rules, voting eligibility or adjudication.
- Supported repeatable editorial formats: Football Controversy, Hot Take, Match Moment and Football Cuts.
- Each episode has an editorial label and a 20–500 character introduction to frame the football question and invite consideration of both sides.
- Admin can publish an existing Court as an episode, feature/unfeature it in the member experience, and review the episode catalogue.
- Admin-only publishing uses the existing authenticated editorial administrator session, same-origin protection and audit log.
- Member discovery includes a dedicated Settle This! Originals / Settle the Argument showcase with format, episode label, context, opposing positions and participation count.
- Episode entry opens the underlying existing Court, retaining its existing participation, moderation, wallet, notification and official verdict rules.
- Public episode feed includes only featured episodes linked to visible Courts; no unrestricted member publishing, creator payouts or creator popularity ranking.
- Crowd position counts and reactions are descriptive participation signals only; they do not replace editorial adjudication.
- No new CT spending, reward or token mechanics were introduced.

Final production validation remains deferred until all planned Phase Three components are implemented. No live app journeys or automated test suites are run during feature development.


## Component 5 implementation record — Supporter identity and CT participation

Implementation scope:
- Added a compact supporter identity treatment to the member profile. A member's selected clubhouse is displayed as a self-declared supporter affiliation, never as an officially verified club relationship.
- Added earned, non-transferable identity markers based on visible platform activity: Court Regular (5 Court entries), Case Maker (3 visible arguments), and Verdict Winner (at least one settled Court win). These are descriptive milestones, not XP, a spendable balance, a ranking score or a reward multiplier.
- Added the optional Stadium Roar Court interaction. An active participant may send one Stadium Roar per open Court for 100 CT.
- The Stadium Roar is deliberately side-neutral and only contributes to a shared Court atmosphere count. It does not promote a member's argument, increase reactions, add votes, alter vote weight, change rankings, affect adjudication or earn SETHIS.
- Cost and effect are disclosed before confirmation. Server-side checks require an authenticated Telegram member, active participation, a visible open Court within its published time window, at least 100 CT and no previous roar by that member on that Court.
- The one-per-member-per-Court rule is enforced by a database uniqueness constraint. CT debit uses a unique wallet-ledger idempotency key and the existing wallet ledger; the wallet integrity audit recognises the new court_roar CT debit type.
- CT and SETHIS remain separate. No SETHIS is spent or awarded by this feature.
- No NFTs, transferable badges, creator influence, vote buying or additional token conversion mechanics are introduced.

The new participation price is a fixed 100 CT for one decorative, side-neutral Court effect. The interaction is optional; core Court access, argument posting, reactions and voting rules remain unchanged.

Final production validation remains deferred until all planned Phase Three components are implemented. No live member journeys or automated test suites are run during feature development.


## Component 6 implementation record — Competition and regional expansion

Implementation scope completed:
- Added a structured competition catalogue keyed by competition, country/association and season, with region, editorial language code, enabled/disabled status, discovery order and an optional coverage note.
- Added an Admin Competition Coverage workspace to register new competition seasons, assign regions, set the editorial language code, control member visibility and adjust discovery ordering.
- Existing fixture seasons are backfilled into the catalogue by migration. Newly created or reclassified fixtures are automatically registered by database triggers without overwriting an Admin's existing region or visibility choices.
- Member Competition Discovery now groups its available competition seasons by region and provides region-level filtering across fixture discovery and completed Match Court archives.
- Fixture, team and country filters are scoped to the selected region. Disabled competition seasons are excluded from public discovery and archive results.
- Competition entries may be registered before fixtures exist, allowing the editorial team to prepare coverage without inventing fixtures, scores or live status.
- Coverage language is stored as editorial metadata only. This component does not claim to translate the interface or provide localized editorial content.
- Fixture creation and match lifecycle remain manually managed. No external live-data provider, automatic fixture ingestion, score feed or scheduler was introduced.
- Existing Courts, CT/SETHIS accounting, moderation and adjudication are unchanged.

Supported region groups: Africa, Europe, Asia, North America, South America, Oceania and Global / Unassigned. Admin must assign each competition to the appropriate region; unclassified existing catalogue entries remain Global / Unassigned until reviewed.

Final production validation remains deferred until all planned Phase Three components are implemented. No live member journeys, external-provider tests, authenticated Admin browser tests or automated test suites are run during feature development.


## Component 7 research record — Future token ecosystem

Research assessment completed on 16 November 2026 and documented in [SETHIS Token Ecosystem — Research & Readiness Assessment](SETHIS_TOKEN_ECOSYSTEM_RESEARCH.md).

Findings and direction:
- Current CT and SETHIS balances are separate off-chain database-ledger balances. The reviewed member application and Worker do not implement SETHIS wallet connections, blockchain transfers, cash-out, exchange or SETHIS spending.
- Preserve CT as the platform participation currency and SETHIS as the separate reward balance.
- Recommend continuing with a closed-loop, non-transferable, non-cash-redeemable Settle This! rewards model while validating member utility and business demand. This may fit relevant Nigerian loyalty/rewards exclusions only if the actual functionality and operating model satisfy the applicable conditions; legal confirmation is required.
- Research reviewed Nigeria's CBN non-security virtual-asset regulations effective 5 November 2026, Investments and Securities Act 2025, Nigeria Tax Administration Act 2025, 2026 virtual-asset coordination framework, SEC revised minimum-capital circular, and Telegram's TON/TON Connect requirements for Mini Apps with cryptocurrency functionality.
- On-chain issuance, wallet integration, SETHIS transfers, cash redemption, exchange activity and airdrops remain out of scope and require separate legal, commercial and explicit owner approval.
- No token contract, wallet connection, blockchain transaction, token supply, airdrop or wallet mechanic was implemented or changed.

This component is complete as a research deliverable only. Any future implementation requires a separate approved scope.
