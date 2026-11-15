ALTER TABLE telegram_users ADD COLUMN onboarding_completed_at TEXT;
ALTER TABLE telegram_users ADD COLUMN welcome_gift_claimed_at TEXT;
ALTER TABLE wallet_ledger ADD COLUMN grant_source TEXT;
ALTER TABLE wallet_ledger ADD COLUMN grant_reason TEXT;
ALTER TABLE wallet_ledger ADD COLUMN admin_id TEXT;
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_grants ON wallet_ledger(grant_source, created_at DESC);
