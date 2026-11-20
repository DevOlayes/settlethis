# SETHIS — Current Product Direction

**Status:** Current product definition  
**Product:** SETHIS / Settle This!  
**Primary experience:** Telegram Mini App, mobile-first  
**First featured game:** Guess Who? / Mystery Footballer

## 1. Product definition

SETHIS is a football gaming and entertainment platform for registered football fans. Members play football challenges, test their knowledge, build a game record, compete on rankings, earn eligible rewards and invite their friends.

The product is no longer a football courtroom, debate network or platform for joining sides and waiting for verdicts. The previous Courts experience is retired from the member-facing product.

The Games area is the centre of the new experience. Mystery Footballer is the first featured game, not the only game the platform will ever contain. The product architecture and language must support additional games without making the whole platform look like a single-game website.

## 2. Member experience and navigation

The primary navigation contains five destinations:

### Games
The home for available football games. Mystery Footballer is the first featured title. The Games hub should make it clear that additional games will join the line-up as they are developed and released. Do not invent future game names or imply that unreleased games are playable.

### Tasks
A place for daily football quizzes, member missions, check-ins and eligible reward activities. Each task must clearly explain what the member must do, how completion is verified and what reward is available. A reward amount is information, not a button; only the action itself should look clickable.

### Rankings
Competitive standings based on recorded game performance. Mystery Footballer points are the leading ranking metric at launch. CT spending must never buy ranking points or improve a member's position.

### Referrals
Personal invite links, invited-member status, qualification progress, milestone rewards and community growth information. Qualification requirements and rewards must be explicit and must reflect server-side rules.

### Wallet
Separate CT and SETHIS balances, recorded transactions and available ways to earn CT. The wallet must explain the purpose of each balance and never imply that the two are interchangeable.

Help & Information and Customer Care are accessible from Wallet. Their content must describe the current games product, not the retired Courts experience.

## 3. First featured game: Guess Who? / Mystery Footballer

Mystery Footballer is a football identity guessing game. The identity of a footballer is hidden while the member uses clues and guesses to identify the player.

### Current round structure

- A member must be registered and signed in through the official Telegram Mini App.
- Guest play is not available.
- Members choose Easy, Medium or Hard.
- Each round has three clues and up to three guesses.
- A member can unlock the next clue when they need another hint.
- An incorrect guess uses one chance.
- Three incorrect guesses end the round and reveal the answer.
- The current default round duration is 10 minutes. Admin can configure the duration for new rounds.
- The CT entry cost is configurable by Admin. The current default is 100 CT.
- CT is deducted only when the round is successfully created.
- Existing rounds keep the entry cost and expiry values recorded when they started.

### Scoring

A correct answer is worth:

| When the player is identified | Game points |
| --- | ---: |
| Using clue 1 | 100 |
| Using clue 2 | 70 |
| Using clue 3 | 40 |

Three incorrect guesses award no game points and reveal the player. Rankings are based on recorded points and game performance, not CT spending.

### Content management

Admin manages the Mystery Footballer question bank, including:

- Player answer and accepted name variations
- Nationality
- Difficulty
- Exactly three clues per player
- Avatar mapping
- Active or inactive rotation status
- CT entry cost
- Round duration

The mystery identity must remain hidden during an active round. Member-facing visuals must use the masked football identity treatment rather than exposing a real player portrait or answer prematurely.

## 4. CT and SETHIS

### CT — participation currency

CT is the in-app currency used for eligible game entries and configured activities. CT is separate from SETHIS.

Current CT sources include the one-time welcome gift and verified rewarded-ad credits. Rewarded-ad availability, cooldowns and daily limits are enforced by the platform. The current configured home reward is 100 CT, with a shared 20-minute cooldown and a maximum of 30 verified ad events per member per Lagos calendar day.

### SETHIS — platform reward token

SETHIS is a separate reward balance. It may be credited for eligible tasks, quizzes, referrals and other explicitly configured reward programmes.

SETHIS and CT are not interchangeable. No cash value, exchange listing, withdrawal, external transfer or blockchain utility should be promised unless a separately approved and legally reviewed product decision authorises it.

### Wallet integrity

- Every credit and debit must be recorded in the server-side wallet ledger.
- Rewarded-ad credits require provider verification and server-side validation.
- Task rewards must follow their configured verification and approval method.
- Referral rewards require server-confirmed qualification.
- Client-side success messages must never create a reward by themselves.
- Balances shown in the UI must remain legible and consistent across the header, Wallet and game screens.

## 5. Other games and the growing Games hub

Mystery Footballer is the first featured game. Additional football games are part of the product direction, but their exact formats, rules, scoring and rewards must be defined before implementation.

The existing daily and fixture football quizzes remain available within Tasks for now. Their placement and the wider Games hub can be revisited as the game catalogue expands.

For every future game, define before release:

1. The core player experience and objective
2. Entry requirements and any CT cost
3. Rules, round duration and completion conditions
4. Scoring and ranking treatment
5. Reward eligibility, if any
6. Admin content and configuration controls
7. Help Centre answers and Customer Care categories
8. Abuse prevention and server-side validation

Do not add placeholder games that appear playable when they are not.

## 6. Member profile and game record

The member profile should focus on football identity and game performance:

- Games played
- Players identified
- Game points
- Game rank
- Quiz attempts and results
- Earned SETHIS
- CT usage
- Game-specific achievements
- Recent Mystery Footballer rounds
- Recent quiz attempts
- Recent wallet activity

Do not show retired Court entries, debate arguments, replies, verdict wins or Pool Court positions as current product activity.

## 7. Help & Information and Customer Care

All explanations must match the actual product. Quick answers should cover:

- What SETHIS is
- How Guess Who? / Mystery Footballer works
- How to start a round
- Clues, guesses and time limits
- Scoring and rankings
- CT versus SETHIS
- Welcome gift eligibility
- Rewarded ads, cooldowns and limits
- Registration and guest-play restrictions
- Referrals and task rewards
- Wallet history and support

Customer Care topics should include account and profile, games and game results, CT/SETHIS and wallet, tasks and rewards, referrals and invitations, technical issues, safety and other enquiries.

No Help Centre, onboarding, notification, empty-state or support copy should direct members to join a Court, choose a side, make an argument or wait for a verdict.

## 8. Admin and operations

The private Admin Portal should open on Mystery Footballer game management. Its current operational areas include:

- Mystery Footballer content and game settings
- Football quiz management
- Task claims and reward review
- CT wallet grants and wallet integrity
- Referral programme settings
- Customer Care
- Official community links
- Member safety and moderation
- Admin audit history
- Staff access
- Sponsorship and affiliate foundations

Legacy Court editorial, settlement and Pool Court tools are not part of the current member-facing product and should not be promoted as active SETHIS features. Historical database records and backend code are retained during the transition until their dependencies and safe retirement can be reviewed.

The existing scheduled football-content sourcing process is left running during this transition. It must not be paused as part of the UI/product reorientation. Its future role should be assessed against the new game-content pipeline before it is repurposed.

## 9. Visual and interaction principles

- Telegram Mini App first; Android/mobile is the primary usage context.
- Premium, clean, compact and football-specific.
- Use the approved Midnight Aubergine, Deep Plum, Muted Violet, Warm Coral, Soft White and Lavender Grey palette.
- Manrope is the product typeface.
- Keep text readable and CT balances white on dark surfaces.
- Use strong, meaningful football/game icons rather than generic decorative symbols.
- Keep instructions short, clear and action-oriented.
- Avoid excessive whitespace, oversized cards and unnecessary repeated information.
- Make buttons visually distinct from plain reward amounts and supporting metadata.
- Every screen must explain its purpose within the new gaming product.

## 10. Development and validation sequence

1. Align member navigation, onboarding, profile, Tasks, Rankings, Referrals, Wallet, Help and Customer Care with the game-first product.
2. Complete and refine Mystery Footballer as the first featured game.
3. Ensure Admin content controls and reward operations support the current member experience.
4. Define and implement additional games one at a time.
5. Review legacy Court code and records for safe retirement after all dependencies are understood.
6. Complete final live validation only after the planned development work is complete and the product owner explicitly authorises it.

Production builds and deployments may be used during development. Live end-to-end tests, provider callbacks and other real-world validation remain gated until explicit approval.
