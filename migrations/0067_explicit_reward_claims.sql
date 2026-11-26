-- Explicit claim state for Monetag and personal referral milestone rewards.
-- Existing rewards were already credited automatically, so preserve them as claimed.
ALTER TABLE ad_reward_events ADD COLUMN claim_status TEXT NOT NULL DEFAULT 'claimed' CHECK (claim_status IN ('pending','claimed'));
ALTER TABLE ad_reward_events ADD COLUMN claimed_at TEXT;
UPDATE ad_reward_events
SET claimed_at=COALESCE(
  (SELECT created_at FROM wallet_ledger WHERE idempotency_key='monetag:'||ad_reward_events.provider_event_id),
  created_at
)
WHERE claim_status='claimed';

ALTER TABLE referral_rewards ADD COLUMN claim_status TEXT NOT NULL DEFAULT 'claimed' CHECK (claim_status IN ('pending','claimed'));
ALTER TABLE referral_rewards ADD COLUMN claimed_at TEXT;
UPDATE referral_rewards
SET claimed_at=COALESCE(
  (SELECT created_at FROM wallet_ledger WHERE idempotency_key=referral_rewards.ledger_key),
  created_at
)
WHERE claim_status='claimed';

CREATE INDEX IF NOT EXISTS idx_ad_reward_claims_user_status
  ON ad_reward_events(telegram_user_id,claim_status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_reward_claims_user_status
  ON referral_rewards(inviter_user_id,claim_status,milestone);
