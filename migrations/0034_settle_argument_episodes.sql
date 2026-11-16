PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS settle_argument_episodes (
  id TEXT PRIMARY KEY,
  court_id TEXT NOT NULL UNIQUE REFERENCES courts(id) ON DELETE CASCADE,
  format_type TEXT NOT NULL CHECK (format_type IN ('controversy','hot_take','match_moment','football_cuts')),
  editorial_intro TEXT NOT NULL CHECK (length(editorial_intro) BETWEEN 20 AND 500),
  episode_label TEXT NOT NULL CHECK (length(episode_label) BETWEEN 3 AND 80),
  featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0,1)),
  published_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER NOT NULL,
  updated_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_settle_argument_featured
  ON settle_argument_episodes(featured, published_at DESC);
