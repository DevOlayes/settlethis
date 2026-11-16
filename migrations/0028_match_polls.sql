PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS match_polls (
  id TEXT PRIMARY KEY,
  fixture_id TEXT NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  court_id TEXT NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  poll_type TEXT NOT NULL CHECK (poll_type IN ('half_time','match_moment')),
  question TEXT NOT NULL CHECK (length(trim(question)) BETWEEN 5 AND 240),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','open','closed','cancelled')),
  opens_at TEXT NOT NULL,
  closes_at TEXT NOT NULL,
  created_by INTEGER NOT NULL REFERENCES admin_users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (julianday(closes_at) > julianday(opens_at))
);

CREATE TABLE IF NOT EXISTS match_poll_options (
  id TEXT PRIMARY KEY,
  poll_id TEXT NOT NULL REFERENCES match_polls(id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK (length(trim(label)) BETWEEN 1 AND 100),
  position INTEGER NOT NULL CHECK (position BETWEEN 0 AND 5),
  UNIQUE (poll_id, position),
  UNIQUE (id, poll_id)
);

CREATE TABLE IF NOT EXISTS match_poll_votes (
  id TEXT PRIMARY KEY,
  poll_id TEXT NOT NULL REFERENCES match_polls(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  telegram_user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (poll_id, telegram_user_id),
  FOREIGN KEY (option_id, poll_id) REFERENCES match_poll_options(id, poll_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_match_polls_fixture_window ON match_polls(fixture_id, status, opens_at, closes_at);
CREATE INDEX IF NOT EXISTS idx_match_polls_court_window ON match_polls(court_id, status, opens_at, closes_at);
CREATE INDEX IF NOT EXISTS idx_match_poll_options_poll ON match_poll_options(poll_id, position);
CREATE INDEX IF NOT EXISTS idx_match_poll_votes_poll_option ON match_poll_votes(poll_id, option_id);
CREATE INDEX IF NOT EXISTS idx_match_poll_votes_user ON match_poll_votes(telegram_user_id, created_at DESC);
