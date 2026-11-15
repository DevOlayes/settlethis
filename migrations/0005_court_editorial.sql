PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS court_suggestions (
  id TEXT PRIMARY KEY,
  submitted_by TEXT NOT NULL REFERENCES telegram_users(telegram_user_id),
  source_type TEXT NOT NULL CHECK (source_type IN ('editorial','community','live_match','news','statistics')),
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 8 AND 180),
  category TEXT NOT NULL,
  competition TEXT,
  home_team TEXT,
  away_team TEXT,
  home_team_crest TEXT,
  away_team_crest TEXT,
  match_date TEXT,
  match_status TEXT,
  live_minute INTEGER,
  home_score INTEGER,
  away_score INTEGER,
  lineup_status TEXT NOT NULL DEFAULT 'not_available' CHECK (lineup_status IN ('not_available','unconfirmed','confirmed')),
  home_lineup_json TEXT,
  away_lineup_json TEXT,
  incident_minute INTEGER,
  incident_context TEXT NOT NULL,
  evidence_summary TEXT NOT NULL,
  side_a_label TEXT NOT NULL,
  side_a_argument TEXT NOT NULL,
  side_b_label TEXT NOT NULL,
  side_b_argument TEXT NOT NULL,
  resolution_method TEXT NOT NULL,
  resolution_source TEXT NOT NULL,
  closes_at TEXT,
  hero_image_url TEXT,
  image_source_url TEXT,
  image_alt TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','under_review','changes_requested','approved','rejected','published')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS court_suggestion_sources (
  id TEXT PRIMARY KEY,
  suggestion_id TEXT NOT NULL REFERENCES court_suggestions(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  source_label TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'evidence',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS court_editorial_reviews (
  id TEXT PRIMARY KEY,
  suggestion_id TEXT NOT NULL REFERENCES court_suggestions(id) ON DELETE CASCADE,
  reviewer_telegram_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id),
  trending_score INTEGER NOT NULL CHECK (trending_score BETWEEN 0 AND 25),
  disagreement_score INTEGER NOT NULL CHECK (disagreement_score BETWEEN 0 AND 20),
  evidence_score INTEGER NOT NULL CHECK (evidence_score BETWEEN 0 AND 20),
  clarity_score INTEGER NOT NULL CHECK (clarity_score BETWEEN 0 AND 20),
  timeliness_score INTEGER NOT NULL CHECK (timeliness_score BETWEEN 0 AND 15),
  total_score INTEGER NOT NULL CHECK (total_score BETWEEN 0 AND 100),
  decision TEXT NOT NULL CHECK (decision IN ('changes_requested','approved','rejected')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_suggestions_status_created ON court_suggestions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suggestion_sources_suggestion ON court_suggestion_sources(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_editorial_reviews_suggestion ON court_editorial_reviews(suggestion_id, created_at DESC);

ALTER TABLE courts ADD COLUMN match_status TEXT;
ALTER TABLE courts ADD COLUMN live_minute INTEGER;
ALTER TABLE courts ADD COLUMN home_score INTEGER;
ALTER TABLE courts ADD COLUMN away_score INTEGER;
ALTER TABLE courts ADD COLUMN lineup_status TEXT NOT NULL DEFAULT 'not_available';
ALTER TABLE courts ADD COLUMN home_lineup_json TEXT;
ALTER TABLE courts ADD COLUMN away_lineup_json TEXT;
ALTER TABLE courts ADD COLUMN hero_image_url TEXT;
ALTER TABLE courts ADD COLUMN image_source_url TEXT;
ALTER TABLE courts ADD COLUMN image_alt TEXT;
ALTER TABLE courts ADD COLUMN data_checked_at TEXT;
