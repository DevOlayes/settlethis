PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS court_roars (
  id TEXT PRIMARY KEY,
  court_id TEXT NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(court_id,user_id)
);

CREATE INDEX IF NOT EXISTS idx_court_roars_court_created
  ON court_roars(court_id,created_at DESC);
