PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS courts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  competition TEXT,
  home_team TEXT,
  away_team TEXT,
  home_team_crest TEXT,
  away_team_crest TEXT,
  match_date TEXT,
  incident_minute INTEGER,
  incident_context TEXT NOT NULL,
  evidence_url TEXT,
  side_a_label TEXT NOT NULL,
  side_a_argument TEXT NOT NULL,
  side_b_label TEXT NOT NULL,
  side_b_argument TEXT NOT NULL,
  entry_ct INTEGER NOT NULL DEFAULT 500 CHECK (entry_ct >= 0),
  winner_reward_sethis INTEGER NOT NULL DEFAULT 1550 CHECK (winner_reward_sethis >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','locked','settled','cancelled')),
  opens_at TEXT,
  closes_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS court_participants (
  id TEXT PRIMARY KEY,
  court_id TEXT NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  telegram_user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id),
  side TEXT NOT NULL CHECK (side IN ('A','B')),
  entry_ct INTEGER NOT NULL CHECK (entry_ct >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','withdrawn','settled')),
  joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(court_id, telegram_user_id)
);

CREATE TABLE IF NOT EXISTS court_arguments (
  id TEXT PRIMARY KEY,
  court_id TEXT NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  telegram_user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id),
  side TEXT NOT NULL CHECK (side IN ('A','B')),
  body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 2000),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS court_replies (
  id TEXT PRIMARY KEY,
  argument_id TEXT NOT NULL REFERENCES court_arguments(id) ON DELETE CASCADE,
  telegram_user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id),
  body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 1000),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS court_reactions (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('argument','reply')),
  target_id TEXT NOT NULL,
  telegram_user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id),
  reaction TEXT NOT NULL CHECK (reaction IN ('agree','disagree','fire','insightful')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(target_type, target_id, telegram_user_id, reaction)
);

CREATE INDEX IF NOT EXISTS idx_courts_status_closes ON courts(status, closes_at);
CREATE INDEX IF NOT EXISTS idx_court_participants_user ON court_participants(telegram_user_id, joined_at DESC);
CREATE INDEX IF NOT EXISTS idx_court_arguments_court ON court_arguments(court_id, created_at);
CREATE INDEX IF NOT EXISTS idx_court_replies_argument ON court_replies(argument_id, created_at);
CREATE INDEX IF NOT EXISTS idx_court_reactions_target ON court_reactions(target_type, target_id);
