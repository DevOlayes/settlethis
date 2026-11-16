PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS competition_catalogue (
  id TEXT PRIMARY KEY,
  competition TEXT NOT NULL CHECK(length(trim(competition)) BETWEEN 2 AND 100),
  country TEXT NOT NULL DEFAULT '' CHECK(length(country) <= 80),
  season TEXT NOT NULL DEFAULT '' CHECK(length(season) <= 20),
  region_code TEXT NOT NULL DEFAULT 'global' CHECK(region_code IN ('africa','europe','asia','north_america','south_america','oceania','global')),
  language_code TEXT NOT NULL DEFAULT 'en' CHECK(length(language_code) BETWEEN 2 AND 12),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 100 CHECK(sort_order BETWEEN 0 AND 9999),
  description TEXT NOT NULL DEFAULT '' CHECK(length(description) <= 300),
  created_by TEXT NOT NULL DEFAULT 'system',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(competition,country,season)
);

CREATE INDEX IF NOT EXISTS idx_competition_catalogue_region_enabled
  ON competition_catalogue(region_code,enabled,sort_order,competition);

INSERT OR IGNORE INTO competition_catalogue
  (id,competition,country,season,region_code,language_code,enabled,sort_order,created_by)
SELECT lower(hex(randomblob(16))),competition,country,season,'global','en',1,100,'fixture-catalogue-migration'
FROM fixtures
GROUP BY competition,country,season;

CREATE TRIGGER IF NOT EXISTS trg_fixture_catalogue_insert
AFTER INSERT ON fixtures
BEGIN
  INSERT OR IGNORE INTO competition_catalogue
    (id,competition,country,season,region_code,language_code,enabled,sort_order,created_by)
  VALUES(lower(hex(randomblob(16))),NEW.competition,NEW.country,NEW.season,'global','en',1,100,'fixture-auto-catalogue');
END;

CREATE TRIGGER IF NOT EXISTS trg_fixture_catalogue_update
AFTER UPDATE OF competition,country,season ON fixtures
BEGIN
  INSERT OR IGNORE INTO competition_catalogue
    (id,competition,country,season,region_code,language_code,enabled,sort_order,created_by)
  VALUES(lower(hex(randomblob(16))),NEW.competition,NEW.country,NEW.season,'global','en',1,100,'fixture-auto-catalogue');
END;
