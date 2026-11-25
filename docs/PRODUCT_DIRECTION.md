# SETHIS — Current Product Direction

**Status:** Current product definition  
**Product:** SETHIS / Settle This!  
**Member access:** Official Telegram Mini App  
**Games:** Mystery Footballer and Football Runner  
**Wallet currencies:** GT (Game Token) and SETHIS

## 1. Product definition

SETHIS is a football gaming and entertainment platform for registered football fans. Members play football games, build a game record, compete on shared game rankings, earn eligible rewards and invite friends.

The Games experience is the centre of the product. The member-facing product is accessed through the official Telegram Mini App; a general browser session is not an alternative way to play.

## 2. Member experience

The main member destinations are:

- **Games:** Mystery Footballer and Football Runner.
- **Tasks:** available quizzes, missions, check-ins and reward activities.
- **Rankings:** shared competitive standings based on recorded game performance.
- **Referrals:** personal invite links, qualification progress and the existing referral rewards programme.
- **Wallet:** separate GT and SETHIS balances and transaction history.

## 3. Mystery Footballer

Mystery Footballer uses a daily, difficulty-selected question-set format. It is not the former clue-and-guess format.

- Members choose **Easy**, **Medium** or **Hard**.
- Each difficulty set contains **five multiple-choice questions**, each with four answer options.
- A member gets one attempt at the selected daily set.
- A correct answer advances to the next question.
- One incorrect answer ends the attempt and pays no SETHIS reward.
- All five answers must be correct to earn the full SETHIS reward for that difficulty.
- The current entry cost is **300 GT** for each difficulty.
- Current perfect-set rewards are **130 SETHIS (Easy)**, **200 SETHIS (Medium)** and **500 SETHIS (Hard)**.
- The 900-question bank contains 300 active questions at each difficulty.

The game screen and server-side rules are authoritative for availability and the current daily attempt state. Admin manages the question bank and the configured difficulty entry/reward settings.

## 4. Football Runner

Football Runner is an implemented game, not a placeholder or unrewarded preview.

- Daily access costs **500 GT**.
- Repeat runs are available within the daily access period.
- Completed runs can earn SETHIS under the existing Runner reward rules.
- Football Runner participates in the shared game rankings alongside Mystery Footballer.

The server remains responsible for validating run completion, applying the configured reward rules and recording game results. Do not describe Runner as excluded from rewards or shared rankings.

## 5. GT and SETHIS

### GT — Game Token

GT is the in-app participation currency used for eligible game access and configured activities. GT is distinct from SETHIS.

The member-facing name and abbreviation are always **GT (Game Token)**. Do not display or describe the participation currency as CT or Court Tokens.

### SETHIS — reward token

SETHIS is the separate platform reward balance. It is credited for eligible game rewards, approved tasks, referrals and other configured reward programmes.

GT and SETHIS are separate balances; do not describe them as interchangeable. Do not promise cash value, withdrawals, exchange listings, external transfers or blockchain utility unless a separately approved product decision authorises it.

### Wallet integrity

- Credits and debits must be validated server-side and recorded in the wallet ledger.
- Rewarded-ad GT credits require provider verification and server-side validation.
- Task rewards follow their configured verification and approval method.
- Referral rewards follow the existing server-confirmed qualification rules.
- Client-side success messages must never create a reward by themselves.
- GT and SETHIS balances must remain clearly distinguished in the header, Wallet, game screens and transaction history.

## 6. Tasks, referrals and rankings

Tasks show the available action, its verification method and the configured SETHIS reward. Existing task reward allocations and approval rules must be preserved; do not invent a new reward cap or change approved amounts as part of terminology work.

The existing referral system is implemented. Its qualification and reward rules are server-controlled and should not be redefined during documentation or terminology updates.

Rankings combine the recorded performance of the supported games, including Mystery Footballer and Football Runner. Spending GT does not purchase ranking points or improve rank.

## 7. Telegram access and member support

Members access gameplay through the official Telegram bot and its Mini App. Telegram authentication and Mini App context are required.

Help & Information, Customer Care, onboarding, notifications and Admin guidance must describe the current game formats and use GT consistently. Do not publish the former three-clue/three-guess Mystery Footballer rules.

## 8. Admin and operations

The Admin Portal supports current game content and settings, task review, wallet operations, referrals, Customer Care, official community links, member safety and moderation, audit history, staff access and platform analytics. Country reporting uses only Cloudflare’s approximate two-letter country code; raw IP addresses are not stored for this purpose. Per-game presence is a single row per member and game, refreshed at most once every 45 seconds while the game screen is open.

The current product specification is this document. Older Phase One, Phase Two, Phase Three and token-research documents may contain historical terminology and designs from the retired Courts/debate direction; treat them as historical records, not current product instructions.

## 9. Visual and interaction principles

- Telegram Mini App first; mobile is the primary usage context.
- Premium, clean, compact and football-specific.
- Use the approved Midnight Aubergine, Deep Plum, Muted Violet, Warm Coral, Soft White and Lavender Grey palette.
- Manrope is the product typeface.
- Keep text readable and balances legible on dark surfaces.
- Use football/game-specific icons and concise, action-oriented instructions.
- Avoid excessive whitespace, oversized cards and repeated information.

## 10. Completion and validation

Terminology and documentation must match the implemented product before final member testing. Production data, wallet balances, ledger history, reward allocations and game rules must not be altered by a copy/documentation-only change. Final live Telegram testing and production checks are carried out separately with the product owner.
