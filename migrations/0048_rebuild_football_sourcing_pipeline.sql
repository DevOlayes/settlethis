-- Rebuild the editorial sourcing pipeline safely.
-- Keep published editorial records and all user, wallet, Court, Pool Court and fixture data.
-- Stop automatic imports/reviews until the rebuilt pipeline is deliberately enabled.

DROP TRIGGER IF EXISTS trg_fixture_catalogue_insert;
DROP TRIGGER IF EXISTS trg_fixture_catalogue_update;

CREATE TABLE IF NOT EXISTS source_pipeline_control (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0,1)),
  paused_reason TEXT NOT NULL DEFAULT 'Sourcing pipeline rebuild',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO source_pipeline_control(id, enabled, paused_reason)
VALUES (1, 0, 'Sourcing pipeline rebuild');

CREATE TABLE IF NOT EXISTS debate_source_fingerprints (
  source_feed_id TEXT NOT NULL REFERENCES debate_source_feeds(id),
  external_id TEXT NOT NULL,
  canonical_url TEXT NOT NULL DEFAULT '',
  first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(source_feed_id, external_id)
);

INSERT OR IGNORE INTO debate_source_fingerprints(source_feed_id, external_id, canonical_url, first_seen_at)
SELECT source_feed_id, external_id, source_url, MIN(created_at)
FROM debate_candidates
GROUP BY source_feed_id, external_id;

DELETE FROM debate_candidates
WHERE status IN ('pending', 'rejected');

UPDATE debate_source_feeds
SET last_fetched_at = NULL,
    last_error = NULL,
    items_seen = 0,
    items_added = 0,
    updated_at = CURRENT_TIMESTAMP;
