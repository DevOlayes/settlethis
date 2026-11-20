> **PRODUCT CONTEXT UPDATE:** This research was written for the previous Courts/debate-first product. SETHIS is now game-first, with Mystery Footballer as the first featured game. The closed-loop CT/SETHIS and no-cash-value guardrails remain relevant, but Court/Pool-specific utilities and reward examples must be reassessed against [Current Product Direction](PRODUCT_DIRECTION.md) before implementation.

# SETHIS Token Ecosystem — Research & Readiness Assessment

**Status:** Component 7 research deliverable — complete; implementation and token launch remain gated  
**Research date:** 16 November 2026  
**Product:** Settle This! / SETHIS  
**Primary market considered:** Nigeria, with Telegram Mini App distribution

## Executive recommendation

**Do not launch an on-chain SETHIS token yet. Keep CT and SETHIS as separate, closed-loop platform balances while proving that members value the rewards and that the platform has sustainable revenue.**

The existing product already has the foundation of a rewards programme: a server-controlled wallet ledger, separate CT and SETHIS balances, idempotent reward credits, recorded Court outcomes, quiz rewards, referrals and approved tasks. The current SETHIS balance is not connected to a blockchain or external wallet. The reviewed application code contains no SETHIS transfer, cash-out, exchange, or spending flow.

This is a useful starting position. Current Nigerian regulatory material contains an express exclusion for certain loyalty points and reward programmes when they are usable only within a limited network and cannot be exchanged for money or transferred to third parties. That is a promising route for the existing in-app model, but it is **not a legal classification or guarantee**. The product's actual functionality, terms, marketing and economic substance matter.

An on-chain token could eventually support external wallet ownership, public token distribution and airdrops. It would also create materially more legal, operational, security, tax, support and treasury obligations. Telegram's current Mini App terms additionally constrain blockchain choice and wallet connectivity to TON and TON Connect.

The recommended order is therefore:

1. Make the current closed-loop rewards useful and understandable.
2. Measure genuine member engagement and the cost of rewards.
3. Define a sustainable, non-cash in-app utility for SETHIS.
4. Obtain written Nigerian legal/regulatory advice before any transferable or redeemable asset is designed.
5. Consider a TON-based on-chain token only if the business case justifies the additional cost and compliance burden.

This document is research and product direction only. It does not authorise token issuance, wallet integration, token transfers, airdrops, exchange listings, redemption, or changes to the existing wallet rules.

---

## 1. What exists in the product today

### CT — Court/activity currency

- Separate balance from SETHIS in the existing `wallets` table.
- Used for eligible Regular Court entries and Pool Court stakes.
- Used for the optional Stadium Roar interaction (100 CT), which is side-neutral and cannot influence voting or adjudication.
- Earned through defined platform rewards, including the welcome gift, approved promotions and verified rewarded-ad events.
- Debits and credits are recorded in `wallet_ledger` with transaction types and idempotency keys.

### SETHIS — main reward balance

- Separate `sethis_balance` from `ct_balance`.
- Credited for qualifying Court rewards, Pool prizes, quiz rewards, referral rewards, tasks and configured ad rewards.
- Included in member wallet history and earned-reward statistics.
- No blockchain address, token contract, network transaction hash, TON Connect integration or external wallet custody was found in the reviewed application.
- No SETHIS-to-CT conversion, member-to-member transfer, cash-out, exchange, redemption-for-money or SETHIS debit/spend flow was found in the reviewed implementation.

**Current product reality:** SETHIS is an off-chain, platform-accounted reward unit. Calling it a “token” in the product does not itself make it a blockchain asset, but the name alone also cannot determine its legal treatment.

### Important design gap

SETHIS currently accumulates as a reward balance but has no clear member-facing utility beyond being earned, displayed and tracked. Before tokenisation, the product needs a credible answer to:

**“What can I do with SETHIS inside Settle This! that makes earning it worthwhile, without turning it into money or allowing anyone to buy influence over a Court?”**

That is a product question first, not a blockchain question.

---

## 2. Nigerian regulatory position to design around

This is a product research summary, not legal advice. The primary market considered is Nigeria. The applicable position should be reconfirmed by Nigerian counsel before any public token announcement, issuance, transferability, redemption, wallet integration or airdrop.

### 2.1 CBN non-security virtual-asset rules — effective 5 November 2026

The Central Bank of Nigeria's *Regulations for the Operations of Non-Security Virtual Assets in Nigeria*, dated 5 November 2026, establish a risk-based framework for regulated non-security virtual assets and related activities. The framework addresses token designation, issuer and service-provider licensing/authorisation, custody, transfers, payments, settlement, AML/CFT, customer protection, cybersecurity and reporting.

The CBN document expressly excludes loyalty points, rewards programmes, vouchers and similar instruments that:
- are usable only within a limited network; and
- cannot be exchanged for money or transferred to third parties.

It also says regulatory treatment depends on the product's economic substance, functional characteristics and risk profile, not merely the label selected by its operator.

**Product implication:** A non-transferable, non-cash-redeemable SETHIS reward balance that can only be used for defined Settle This! platform benefits may be capable of remaining within a loyalty/rewards model. That is the direction to preserve while the platform is early.

**Do not assume the exclusion applies** if SETHIS becomes transferable, exchangeable, redeemable for cash, usable as general payment, marketed as an investment, or integrated with external trading/custody services. Obtain a formal classification before changing any of those features.

### 2.2 Investments and Securities Act 2025

Nigeria's Investments and Securities Act 2025 includes virtual and digital assets within the statutory securities framework and recognises investment contracts. The economic rights and promotional promises attached to a token can therefore matter.

**Product implication:** Avoid promises of profit, price appreciation, yield, passive income, buybacks, guaranteed value or returns generated by the Settle This! team. A token promoted around an expectation of profit from the work of its promoter can raise securities questions.

### 2.3 Nigeria Tax Administration Act 2025

The Act's Fifth Schedule includes sale, exchange and transfer of virtual assets, mining/staking income, and airdrops, bounties or virtual assets received as compensation or reward among taxable virtual-asset transactions. The same Schedule excludes instruments that provide access to products, services or benefits, including loyalty programmes and other reward systems, from its virtual-asset definition.

**Product implication:** Preserve a complete, auditable record of rewards and the basis for each credit. Do not assume all rewards or future airdrops are tax-free. If the product crosses into virtual-asset territory, tax reporting, valuation and user obligations may change.

### 2.4 Nigeria's 2026 virtual-asset coordination framework

The Presidential Executive Order on Virtual Assets Coordination, 2026 establishes coordination between relevant agencies while preserving their statutory mandates. The State House described the division as securities-related activities under SEC oversight and non-security payment, settlement, custody and related services under CBN oversight.

**Product implication:** A future token launch is not a one-agency checklist. The activity and token design may engage more than one authority.

### 2.5 Regulatory cost and business fit

SEC's 16 January 2026 revised minimum-capital circular lists substantial minimum capital requirements for regulated digital-asset businesses, including a ₦500 million figure for a Digital Assets Platform Operator (including token issuers), ₦1 billion for a Digital Assets Offering Platform, ₦2 billion for a Digital Assets Exchange and ₦2 billion for a Digital Assets Custodian. These figures apply to the named regulated categories; they are **not** a conclusion that Settle This! would automatically fall into one of them.

**Product implication:** Do not build a business plan that assumes issuing a tradable token is cheap or that Settle This! can simply list a token. The classification of the intended activity must come first.

---

## 3. Telegram Mini App constraints

Telegram's Bot Platform Developer Terms state that Mini Apps integrating cryptocurrency functionality must use TON for creation and distribution of cryptocurrency tokens or blockchain assets. Wallet connections and wallet transaction interactions must use the TON Connect SDK. The terms also restrict promotion of non-TON cryptoassets and wallets through the Mini App and its associated official channels.

Practical consequences if Settle This! later adds an on-chain SETHIS asset:

- The token issuance/distribution network for the Mini App must be TON.
- Wallet connection and signing must use TON Connect.
- Do not build an Ethereum, Solana, BNB Chain or other non-TON token launch into the Mini App.
- Do not promote non-TON assets or wallet services through the Mini App or its official Telegram channels.
- Recheck Telegram's terms immediately before implementation; platform rules can change.

**This requirement does not mean we should launch on TON now.** It only defines the platform constraint if we later choose to implement cryptocurrency functionality.

---

## 4. Three possible models

| Model | What members receive | Benefits | Main risks | Recommendation |
|---|---|---|---|---|
| A. Closed-loop SETHIS rewards | Non-transferable in-app reward balance | Lowest complexity; builds on existing ledger; aligns with loyalty/rewards direction | Must keep restrictions real and clear; reward liability and abuse still need controls | **Recommended now** |
| B. Hybrid, gated future claim | Existing off-chain rewards remain; a future separately approved process may allow eligible rewards to be claimed on-chain | Preserves today's experience while leaving a future migration path | Claim mechanics, eligibility, wallet custody, tax, compliance and Telegram rules still need legal review | Revisit only after demand and legal assessment |
| C. Fully on-chain SETHIS | TON token held in external TON wallets, potentially transferable | Public ownership, external ecosystem integrations and possible airdrop/distribution | Highest regulatory, security, treasury, tax, support and market risk; may create speculation that distracts from football product | **Not recommended at this stage** |

### Recommended model: A

Keep the existing SETHIS balance as a Settle This! rewards unit. Keep CT as the separate participation currency. Do not merge the balances or allow conversion between them.

The business should earn revenue from the football product—sponsorships, disclosed affiliate partnerships and other approved commercial formats—not by relying on token speculation.

---

## 5. What SETHIS should do before any blockchain launch

The most important improvement is to give SETHIS a useful, bounded purpose within the product. Possible future utilities to evaluate:

1. **Access to special football experiences:** unlock selected editorial bonus episodes, archive experiences or special quiz packs. Core Courts and ordinary match participation remain accessible without SETHIS.
2. **Supporter experience customisation:** use SETHIS for optional, non-transferable profile presentation or supporter treatments. Avoid NFTs, speculative collectibles and XP.
3. **Member-only football events:** qualify for limited editorial Q&As, community watch-along experiences or special fan sessions. Access must not influence a Court verdict.
4. **Platform benefit redemptions:** redeem SETHIS for clearly described, limited Settle This! benefits if the business can reliably supply them. Do not promise cash value or a guaranteed market price.

These are concepts for validation, not approved mechanics. Before adding any SETHIS spending, model earning rates, redemption costs, fairness, abuse and the effect on existing balances. Never sell votes, verdicts, ranking positions or editorial influence.

### CT and SETHIS must remain distinct

- CT: participation currency; spent on eligible Court actions.
- SETHIS: earned rewards; potential future use for bounded platform benefits.
- No automatic conversion rate between CT and SETHIS.
- No SETHIS purchase using fiat or CT without a separate business, legal and product approval.
- No transfer between members.
- No cash-out, buyback or guaranteed redemption.
- No use as a general payment method outside Settle This!.

---

## 6. Airdrops: future possibility, not a launch strategy

An airdrop can attract attention, but it can also attract bots, multiple accounts, short-term farmers and users who leave as soon as rewards are distributed. It can create tax and regulatory consequences when the asset is a virtual asset.

If a future on-chain SETHIS airdrop is ever approved, it should be a separately governed programme with:
- a written eligibility policy published before the snapshot;
- transparent allocation rules and a fixed maximum distribution;
- anti-sybil and abuse controls;
- no promise that the asset will have a market price or be listed;
- clear treatment of ineligible, duplicate, restricted and sanctioned accounts;
- wallet-security guidance and a support process;
- legal, tax and Telegram compliance review;
- an independent reconciliation of the eligible list and distribution totals.

Do not announce an airdrop, snapshot date, token supply, allocation, listing or launch date now. Do not create artificial engagement tasks simply to inflate token demand.

---

## 7. Security, integrity and operational requirements

The current database ledger is a useful base, but an on-chain design would need a separate security architecture. Before any implementation:

- Maintain an authoritative, append-only internal ledger and reconcile every balance against ledger entries.
- Keep reward issuance idempotent and tied to verifiable events.
- Define who can authorise reward changes and require audit trails and dual approval for high-impact administrative actions.
- Establish a written reward policy, correction policy, fraud/abuse handling and account-appeal process.
- Model reward issuance, outstanding balances, redemption costs and expiry treatment before introducing a SETHIS sink.
- Never store member private keys or seed phrases.
- If TON Connect is added, use the official SDK and verify signed payloads and transaction state server-side; never trust a client-side “success” message.
- Separate platform reward accounting from blockchain transaction records.
- Define a pause/emergency procedure for compromised signing keys, contract defects, abuse or regulatory direction.
- Commission an independent smart-contract security review before any mainnet issuance or distribution.
- Keep member privacy and data minimisation central; do not publish Telegram IDs or personal data on-chain.

---

## 8. Decision gates and staged roadmap

### Gate 1 — Strengthen the current rewards model

- Retain the current off-chain CT/SETHIS ledger.
- Publish clear member terms: rewards are platform-only, non-transferable and not redeemable for money.
- Review every SETHIS earning route for abuse and fair eligibility.
- Identify a small number of bounded in-app SETHIS utilities.
- Measure member retention, repeat participation and reward issuance cost.

### Gate 2 — Validate product demand

- Run a controlled, editorially managed pilot of one SETHIS utility after separate approval.
- Track how many members earn, retain and redeem SETHIS.
- Check whether the utility improves meaningful football participation rather than low-quality activity.
- Review reward liability and abuse before widening access.

### Gate 3 — Legal and commercial feasibility

Before any transferable or on-chain token:
- obtain written Nigerian legal advice on the exact token rights and proposed activities;
- obtain an activity-specific SEC/CBN regulatory classification or advice as counsel recommends;
- assess incorporation, licensing, minimum capital, AML/KYC, tax, consumer protection and reporting obligations;
- assess other jurisdictions before targeting non-Nigerian members;
- assess TON/Telegram compliance and any exchange or distribution partner;
- prepare a costed business case and operating budget.

### Gate 4 — Separate owner approval

Only after Gates 1–3 should the owner decide whether to authorise:
- token name and ticker finalisation;
- supply and issuance policy;
- smart-contract architecture;
- TON Connect integration;
- on-chain distribution or claim;
- airdrop rules;
- exchange, liquidity or market arrangements.

Each item needs its own explicit approval. Approval to research is not approval to issue.

---

## 9. Go / no-go assessment

| Question | Current answer |
|---|---|
| Is there already a working internal rewards ledger? | Yes |
| Is SETHIS currently an on-chain asset? | No evidence of this in the reviewed code |
| Does the current app support SETHIS transfers or cash-out? | No |
| Does SETHIS have a defined spend utility today? | No |
| Is a closed-loop loyalty/rewards model worth preserving? | Yes, subject to legal confirmation and strict controls |
| Is an on-chain token necessary to finish the current product? | No |
| Should we launch an airdrop now? | No |
| If a Telegram Mini App later adds crypto, which chain/wallet rules apply? | TON issuance/distribution and TON Connect wallet interactions |
| Is token issuance or wallet integration approved by this research? | No |

**Decision:** Continue with a closed-loop, non-transferable rewards programme. Reassess on-chain SETHIS only after measurable demand, a real utility, legal classification and a funded operating plan exist.

---

## 10. Official sources reviewed

1. Central Bank of Nigeria, *Regulations for the Operations of Non-Security Virtual Assets in Nigeria*, circular dated 5 November 2026: https://www.cbn.gov.ng/Out/2026/CCD/REGULATIONS%20FOR%20THE%20OPERATIONS%20OF%20NON-SECURITY%20VIRTUAL%20ASSETS%20IN%20NIGERIA.pdf
2. Nigeria, *Investments and Securities Act 2025*, Official Gazette: https://sec.gov.ng/documents/1326/INVESTMENT-AND-SECURITIES-ACT-NIGERIA-2025_1.pdf
3. Nigeria, *Nigeria Tax Administration Act 2025*, Official Gazette: https://login.nipc.gov.ng/assets/resources/nigeria-tax-administration-act-2025/nigeria-tax-administration-act-2025-gazette.pdf
4. State House, *President Tinubu Signs Executive Order on Virtual Assets, Establishes Council to Harmonise Regulation of Digital Economy*, 18 July 2026: https://statehouse.gov.ng/president-tinubu-signs-executive-order-on-virtual-assets-establishes-council-to-harmonise-regulation-of-digital-economy/
5. Securities and Exchange Commission Nigeria, *Revised Minimum Capital for Regulated Capital Market Entities*, 16 January 2026: https://www.sec.gov.ng/for-investors/keep-track-of-circulars/revised-minimum-capital-mc-for-regulated-capital-market-entities/
6. Telegram, *Bot Platform Developer Terms of Service*, Section 7 — Blockchain Integration: https://telegram.org/tos/bot-developers
7. Telegram, *Blockchain Guidelines*: https://core.telegram.org/bots/blockchain-guidelines
8. Financial Action Task Force, *Targeted Update on Implementation of the FATF Standards on Virtual Assets and Virtual Asset Service Providers*, 26 June 2025: https://www.fatf-gafi.org/en/publications/Fatfrecommendations/targeted-update-virtual-assets-vasps-2025.html

**Limitations:** This is a product and technical readiness assessment, not a Nigerian legal opinion, tax opinion, regulatory filing or financial promotion review. Regulations and platform terms may change. Obtain advice from qualified Nigerian counsel and verify current regulator requirements before taking any step toward issuance, transferability, redemption, wallet connection, airdrops or exchange activity.
