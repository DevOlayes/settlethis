-- One Game Token entry unlocks each game for the full Lagos calendar day.
CREATE TABLE IF NOT EXISTS game_daily_access (
  user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id) ON DELETE CASCADE,
  game_key TEXT NOT NULL CHECK(game_key IN ('football_runner','mystery_footballer')),
  access_date TEXT NOT NULL,
  entry_cost INTEGER NOT NULL CHECK(entry_cost >= 0),
  ledger_id TEXT REFERENCES wallet_ledger(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,game_key,access_date)
);
CREATE INDEX IF NOT EXISTS idx_game_daily_access_date ON game_daily_access(game_key,access_date);
