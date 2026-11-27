-- Gram Wallet ownership verification and one-time SETHIS task reward.
INSERT OR IGNORE INTO task_catalog(task_key,title,description,reward_token,reward_amount,verification_method,active)
VALUES('gram_wallet','Connect Wallet','Connect your Gram Wallet and verify wallet ownership.', 'SETHIS',400,'manual',1);

CREATE TABLE IF NOT EXISTS gram_wallet_challenges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id) ON DELETE CASCADE,
  payload TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gram_wallet_challenges_user ON gram_wallet_challenges(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS gram_wallet_connections (
  user_id TEXT PRIMARY KEY REFERENCES telegram_users(telegram_user_id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL UNIQUE,
  wallet_app_name TEXT NOT NULL,
  network TEXT NOT NULL,
  connected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  rewarded_at TEXT
);
