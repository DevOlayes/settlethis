PRAGMA foreign_keys = ON;

ALTER TABLE court_suggestions ADD COLUMN fixture_id TEXT REFERENCES fixtures(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_court_suggestions_fixture ON court_suggestions(fixture_id);
