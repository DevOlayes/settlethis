CREATE TABLE IF NOT EXISTS runner_game_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed','abandoned')),
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  elapsed_ms INTEGER CHECK(elapsed_ms IS NULL OR elapsed_ms BETWEEN 0 AND 1800000),
  distance INTEGER NOT NULL DEFAULT 0 CHECK(distance >= 0),
  points INTEGER NOT NULL DEFAULT 0 CHECK(points >= 0),
  footballs INTEGER NOT NULL DEFAULT 0 CHECK(footballs >= 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_runner_one_active_run_per_user
  ON runner_game_runs(user_id) WHERE status='active';
CREATE INDEX IF NOT EXISTS idx_runner_runs_user_completed
  ON runner_game_runs(user_id, status, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_runner_runs_completed_score
  ON runner_game_runs(status, points DESC, distance DESC, footballs DESC);
