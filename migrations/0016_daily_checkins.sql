CREATE TABLE IF NOT EXISTS daily_checkins (
  id TEXT PRIMARY KEY,
  telegram_user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id) ON DELETE CASCADE,
  checkin_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(telegram_user_id, checkin_date)
);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date
  ON daily_checkins(telegram_user_id, checkin_date DESC);
