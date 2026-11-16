CREATE TABLE IF NOT EXISTS fixtures (
  id TEXT PRIMARY KEY,
  competition TEXT NOT NULL CHECK(length(trim(competition)) BETWEEN 2 AND 100),
  country TEXT NOT NULL DEFAULT '' CHECK(length(country) <= 80),
  season TEXT NOT NULL DEFAULT '' CHECK(length(season) <= 20),
  home_team TEXT NOT NULL CHECK(length(trim(home_team)) BETWEEN 2 AND 100),
  away_team TEXT NOT NULL CHECK(length(trim(away_team)) BETWEEN 2 AND 100),
  kickoff_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','live','half_time','full_time','postponed','cancelled')),
  home_score INTEGER CHECK(home_score IS NULL OR home_score BETWEEN 0 AND 99),
  away_score INTEGER CHECK(away_score IS NULL OR away_score BETWEEN 0 AND 99),
  match_court_id TEXT UNIQUE,
  notes TEXT NOT NULL DEFAULT '' CHECK(length(notes) <= 1000),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(home_team <> away_team),
  CHECK((home_score IS NULL AND away_score IS NULL) OR (home_score IS NOT NULL AND away_score IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_fixtures_status_kickoff ON fixtures(status,kickoff_at);
CREATE INDEX IF NOT EXISTS idx_fixtures_competition_kickoff ON fixtures(competition,kickoff_at);
