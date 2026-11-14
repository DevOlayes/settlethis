CREATE TABLE IF NOT EXISTS pool_courts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  prize_amount INTEGER NOT NULL CHECK (prize_amount > 0),
  minimum_stake_ct INTEGER NOT NULL CHECK (minimum_stake_ct > 0),
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','open','locked','settled','cancelled')),
  opens_at TEXT,
  closes_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS pool_positions (
  id TEXT PRIMARY KEY,
  pool_id TEXT NOT NULL REFERENCES pool_courts(id),
  user_id TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('A','B')),
  stake_ct INTEGER NOT NULL CHECK (stake_ct >= 500),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','refunded','settled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(pool_id,user_id)
);
CREATE TABLE IF NOT EXISTS wallets (
  user_id TEXT PRIMARY KEY,
  ct_balance INTEGER NOT NULL DEFAULT 0 CHECK (ct_balance >= 0),
  sethis_balance INTEGER NOT NULL DEFAULT 0 CHECK (sethis_balance >= 0),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS wallet_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL CHECK (token IN ('CT','SETHIS')),
  amount INTEGER NOT NULL CHECK (amount <> 0),
  transaction_type TEXT NOT NULL,
  reference_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS pool_invites (
  id TEXT PRIMARY KEY,
  pool_id TEXT NOT NULL REFERENCES pool_courts(id),
  inviter_user_id TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  side TEXT NOT NULL CHECK (side IN ('A','B')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pool_positions_pool_side ON pool_positions(pool_id,side);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user_created ON wallet_ledger(user_id,created_at DESC);
