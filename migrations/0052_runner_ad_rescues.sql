CREATE TABLE IF NOT EXISTS runner_ad_rescues (
  ymid TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES runner_game_runs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','valued','non_valued','expired')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valued_at TEXT,
  provider_event_type TEXT
);
CREATE INDEX IF NOT EXISTS idx_runner_ad_rescues_user_day
  ON runner_ad_rescues(user_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_runner_ad_rescues_run
  ON runner_ad_rescues(run_id, status);