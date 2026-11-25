-- SETHIS games, daily entry controls and two-level community leadership.
ALTER TABLE mystery_game_settings ADD COLUMN daily_entry_limit INTEGER NOT NULL DEFAULT 5 CHECK(daily_entry_limit BETWEEN 1 AND 20);
ALTER TABLE mystery_game_settings ADD COLUMN reward_easy_clue1 INTEGER NOT NULL DEFAULT 10 CHECK(reward_easy_clue1 BETWEEN 0 AND 1000);
ALTER TABLE mystery_game_settings ADD COLUMN reward_easy_clue2 INTEGER NOT NULL DEFAULT 7 CHECK(reward_easy_clue2 BETWEEN 0 AND 1000);
ALTER TABLE mystery_game_settings ADD COLUMN reward_easy_clue3 INTEGER NOT NULL DEFAULT 5 CHECK(reward_easy_clue3 BETWEEN 0 AND 1000);
ALTER TABLE mystery_game_settings ADD COLUMN reward_medium_clue1 INTEGER NOT NULL DEFAULT 20 CHECK(reward_medium_clue1 BETWEEN 0 AND 1000);
ALTER TABLE mystery_game_settings ADD COLUMN reward_medium_clue2 INTEGER NOT NULL DEFAULT 14 CHECK(reward_medium_clue2 BETWEEN 0 AND 1000);
ALTER TABLE mystery_game_settings ADD COLUMN reward_medium_clue3 INTEGER NOT NULL DEFAULT 10 CHECK(reward_medium_clue3 BETWEEN 0 AND 1000);
ALTER TABLE mystery_game_settings ADD COLUMN reward_hard_clue1 INTEGER NOT NULL DEFAULT 35 CHECK(reward_hard_clue1 BETWEEN 0 AND 1000);
ALTER TABLE mystery_game_settings ADD COLUMN reward_hard_clue2 INTEGER NOT NULL DEFAULT 25 CHECK(reward_hard_clue2 BETWEEN 0 AND 1000);
ALTER TABLE mystery_game_settings ADD COLUMN reward_hard_clue3 INTEGER NOT NULL DEFAULT 15 CHECK(reward_hard_clue3 BETWEEN 0 AND 1000);
ALTER TABLE mystery_game_settings ADD COLUMN daily_sethis_cap INTEGER NOT NULL DEFAULT 150 CHECK(daily_sethis_cap BETWEEN 0 AND 10000);
UPDATE mystery_game_settings SET entry_ct=300,daily_entry_limit=5 WHERE id=1;

CREATE TABLE IF NOT EXISTS runner_reward_settings (
  id INTEGER PRIMARY KEY CHECK(id=1),
  entry_cost INTEGER NOT NULL DEFAULT 500 CHECK(entry_cost BETWEEN 1 AND 100000),
  ball_reward INTEGER NOT NULL DEFAULT 2 CHECK(ball_reward BETWEEN 0 AND 100),
  distance_step INTEGER NOT NULL DEFAULT 500 CHECK(distance_step BETWEEN 1 AND 100000),
  distance_reward INTEGER NOT NULL DEFAULT 5 CHECK(distance_reward BETWEEN 0 AND 1000),
  points_threshold_one INTEGER NOT NULL DEFAULT 5000 CHECK(points_threshold_one BETWEEN 1 AND 100000000),
  points_reward_one INTEGER NOT NULL DEFAULT 10 CHECK(points_reward_one BETWEEN 0 AND 1000),
  points_threshold_two INTEGER NOT NULL DEFAULT 10000 CHECK(points_threshold_two BETWEEN 1 AND 100000000),
  points_reward_two INTEGER NOT NULL DEFAULT 20 CHECK(points_reward_two BETWEEN 0 AND 1000),
  per_run_cap INTEGER NOT NULL DEFAULT 100 CHECK(per_run_cap BETWEEN 0 AND 10000),
  daily_cap INTEGER NOT NULL DEFAULT 300 CHECK(daily_cap BETWEEN 0 AND 100000),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO runner_reward_settings(id) VALUES(1);

CREATE TABLE IF NOT EXISTS member_activity_events (
  event_key TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK(event_type IN ('football_runner','mystery_footballer','approved_task')),
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_member_activity_user_time ON member_activity_events(user_id,occurred_at DESC);

INSERT OR IGNORE INTO member_activity_events(event_key,user_id,event_type,occurred_at)
SELECT 'runner:'||id,user_id,'football_runner',COALESCE(completed_at,started_at) FROM runner_game_runs WHERE status='completed';
INSERT OR IGNORE INTO member_activity_events(event_key,user_id,event_type,occurred_at)
SELECT 'mystery:'||id,user_id,'mystery_footballer',COALESCE(completed_at,started_at) FROM mystery_game_rounds WHERE status IN ('won','missed');
INSERT OR IGNORE INTO member_activity_events(event_key,user_id,event_type,occurred_at)
SELECT 'task:'||id,user_id,'approved_task',COALESCE(reviewed_at,created_at) FROM task_claims WHERE status='approved';

CREATE TABLE IF NOT EXISTS community_leader_settings (
  id INTEGER PRIMARY KEY CHECK(id=1),
  programme_enabled INTEGER NOT NULL DEFAULT 1 CHECK(programme_enabled IN (0,1)),
  direct_rate_bps INTEGER NOT NULL DEFAULT 1000 CHECK(direct_rate_bps BETWEEN 0 AND 10000),
  upline_rate_bps INTEGER NOT NULL DEFAULT 200 CHECK(upline_rate_bps BETWEEN 0 AND 10000),
  max_combined_rate_bps INTEGER NOT NULL DEFAULT 1200 CHECK(max_combined_rate_bps BETWEEN 0 AND 1200),
  personal_leader_threshold INTEGER NOT NULL DEFAULT 500 CHECK(personal_leader_threshold BETWEEN 1 AND 1000000),
  hybrid_personal_threshold INTEGER NOT NULL DEFAULT 250 CHECK(hybrid_personal_threshold BETWEEN 1 AND 1000000),
  branch_leader_threshold INTEGER NOT NULL DEFAULT 500 CHECK(branch_leader_threshold BETWEEN 1 AND 1000000),
  active_ratio_min INTEGER NOT NULL DEFAULT 35 CHECK(active_ratio_min BETWEEN 1 AND 100),
  active_ratio_warning INTEGER NOT NULL DEFAULT 20 CHECK(active_ratio_warning BETWEEN 1 AND 100),
  recovery_days INTEGER NOT NULL DEFAULT 14 CHECK(recovery_days BETWEEN 1 AND 90),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(direct_rate_bps+upline_rate_bps<=max_combined_rate_bps)
);
INSERT OR IGNORE INTO community_leader_settings(id) VALUES(1);

CREATE TABLE IF NOT EXISTS community_leaders (
  user_id TEXT PRIMARY KEY REFERENCES telegram_users(telegram_user_id) ON DELETE CASCADE,
  personal_qualified_count INTEGER NOT NULL DEFAULT 0,
  branch_qualified_count INTEGER NOT NULL DEFAULT 0,
  active_member_count INTEGER NOT NULL DEFAULT 0,
  active_ratio REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'recovering' CHECK(status IN ('active','recovering','suspended')),
  low_activity_since TEXT,
  qualified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_community_leaders_status ON community_leaders(status,updated_at);

CREATE TABLE IF NOT EXISTS community_commissions (
  id TEXT PRIMARY KEY,
  source_user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id),
  source_ledger_key TEXT NOT NULL,
  recipient_user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id),
  tier TEXT NOT NULL CHECK(tier IN ('direct','upline')),
  rate_bps INTEGER NOT NULL CHECK(rate_bps BETWEEN 0 AND 1200),
  amount INTEGER NOT NULL CHECK(amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','void')),
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  credited_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_community_commissions_recipient ON community_commissions(recipient_user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_commissions_source ON community_commissions(source_user_id,source_ledger_key);

-- Backfill leader qualification and retention data from existing qualified referral trees.
