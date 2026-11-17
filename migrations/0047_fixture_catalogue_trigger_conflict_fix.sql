-- Prevent fixture UPSERT conflict handling from surfacing duplicate catalogue rows.
-- The prior INSERT OR IGNORE trigger was overridden by the outer fixture UPSERT's
-- conflict policy on some D1 execution paths. Guard the insert before it is attempted.

DROP TRIGGER IF EXISTS trg_fixture_catalogue_insert;
DROP TRIGGER IF EXISTS trg_fixture_catalogue_update;

CREATE TRIGGER trg_fixture_catalogue_insert
AFTER INSERT ON fixtures
BEGIN
  INSERT INTO competition_catalogue(
    id, competition, country, season, region_code, language_code,
    enabled, sort_order, created_by
  )
  SELECT
    lower(hex(randomblob(16))), NEW.competition, NEW.country, NEW.season,
    'global', 'en', 1, 100, 'fixture-auto-catalogue'
  WHERE NOT EXISTS (
    SELECT 1
    FROM competition_catalogue
    WHERE competition = NEW.competition
      AND country = NEW.country
      AND season = NEW.season
  );
END;

CREATE TRIGGER trg_fixture_catalogue_update
AFTER UPDATE OF competition, country, season ON fixtures
BEGIN
  INSERT INTO competition_catalogue(
    id, competition, country, season, region_code, language_code,
    enabled, sort_order, created_by
  )
  SELECT
    lower(hex(randomblob(16))), NEW.competition, NEW.country, NEW.season,
    'global', 'en', 1, 100, 'fixture-auto-catalogue'
  WHERE NOT EXISTS (
    SELECT 1
    FROM competition_catalogue
    WHERE competition = NEW.competition
      AND country = NEW.country
      AND season = NEW.season
  );
END;
