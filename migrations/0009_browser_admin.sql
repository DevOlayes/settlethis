PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_iterations INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry ON admin_sessions(expires_at);

DROP INDEX IF EXISTS idx_editorial_reviews_suggestion;
ALTER TABLE court_editorial_reviews RENAME TO court_editorial_reviews_legacy;

CREATE TABLE court_editorial_reviews (
  id TEXT PRIMARY KEY,
  suggestion_id TEXT NOT NULL REFERENCES court_suggestions(id) ON DELETE CASCADE,
  reviewer_telegram_id TEXT REFERENCES telegram_users(telegram_user_id),
  reviewer_admin_id INTEGER REFERENCES admin_users(id),
  trending_score INTEGER NOT NULL CHECK (trending_score BETWEEN 0 AND 25),
  disagreement_score INTEGER NOT NULL CHECK (disagreement_score BETWEEN 0 AND 20),
  evidence_score INTEGER NOT NULL CHECK (evidence_score BETWEEN 0 AND 20),
  clarity_score INTEGER NOT NULL CHECK (clarity_score BETWEEN 0 AND 20),
  timeliness_score INTEGER NOT NULL CHECK (timeliness_score BETWEEN 0 AND 15),
  total_score INTEGER NOT NULL CHECK (total_score BETWEEN 0 AND 100),
  decision TEXT NOT NULL CHECK (decision IN ('changes_requested','approved','rejected')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ((reviewer_telegram_id IS NOT NULL AND reviewer_admin_id IS NULL) OR
         (reviewer_telegram_id IS NULL AND reviewer_admin_id IS NOT NULL))
);

INSERT INTO court_editorial_reviews
(id,suggestion_id,reviewer_telegram_id,reviewer_admin_id,trending_score,disagreement_score,evidence_score,clarity_score,timeliness_score,total_score,decision,notes,created_at)
SELECT id,suggestion_id,reviewer_telegram_id,NULL,trending_score,disagreement_score,evidence_score,clarity_score,timeliness_score,total_score,decision,notes,created_at
FROM court_editorial_reviews_legacy;

DROP TABLE court_editorial_reviews_legacy;
CREATE INDEX IF NOT EXISTS idx_editorial_reviews_suggestion ON court_editorial_reviews(suggestion_id, created_at DESC);
