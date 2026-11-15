ALTER TABLE pool_courts ADD COLUMN winner_side TEXT CHECK(winner_side IN ('A','B'));
ALTER TABLE pool_courts ADD COLUMN verdict TEXT;
ALTER TABLE pool_courts ADD COLUMN adjudication_notes TEXT;
ALTER TABLE pool_courts ADD COLUMN adjudication_source TEXT;
ALTER TABLE pool_courts ADD COLUMN adjudicated_by INTEGER REFERENCES admin_users(id);
ALTER TABLE pool_courts ADD COLUMN settled_at TEXT;
CREATE TABLE IF NOT EXISTS pool_adjudications (
  id TEXT PRIMARY KEY,
  pool_id TEXT NOT NULL UNIQUE REFERENCES pool_courts(id),
  admin_id INTEGER NOT NULL REFERENCES admin_users(id),
  winner_side TEXT NOT NULL CHECK(winner_side IN ('A','B')),
  verdict TEXT NOT NULL,
  rationale TEXT NOT NULL,
  source_url TEXT NOT NULL,
  winner_stake_ct INTEGER NOT NULL,
  winner_count INTEGER NOT NULL,
  prize_amount INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
