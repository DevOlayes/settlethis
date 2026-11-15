ALTER TABLE courts ADD COLUMN winner_side TEXT CHECK (winner_side IN ('A','B'));
ALTER TABLE courts ADD COLUMN verdict TEXT;
ALTER TABLE courts ADD COLUMN adjudication_notes TEXT;
ALTER TABLE courts ADD COLUMN adjudication_source TEXT;
ALTER TABLE courts ADD COLUMN adjudicated_by INTEGER REFERENCES admin_users(id);
ALTER TABLE courts ADD COLUMN settled_at TEXT;
CREATE TABLE IF NOT EXISTS court_adjudications (
 id TEXT PRIMARY KEY,
 court_id TEXT NOT NULL UNIQUE REFERENCES courts(id),
 admin_id INTEGER NOT NULL REFERENCES admin_users(id),
 winner_side TEXT NOT NULL CHECK (winner_side IN ('A','B')),
 verdict TEXT NOT NULL,
 rationale TEXT NOT NULL,
 source_url TEXT NOT NULL,
 winner_count INTEGER NOT NULL DEFAULT 0,
 reward_per_winner INTEGER NOT NULL DEFAULT 1550,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_court_adjudications_created ON court_adjudications(created_at DESC);
