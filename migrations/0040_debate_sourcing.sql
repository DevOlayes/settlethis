PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS debate_source_feeds (
  id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  feed_url TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL DEFAULT 'rss' CHECK(source_type IN ('rss','football_api')),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
  interval_minutes INTEGER NOT NULL DEFAULT 360 CHECK(interval_minutes BETWEEN 30 AND 1440),
  last_fetched_at TEXT,
  last_error TEXT,
  items_seen INTEGER NOT NULL DEFAULT 0,
  items_added INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS debate_candidates (
  id TEXT PRIMARY KEY,
  source_feed_id TEXT NOT NULL REFERENCES debate_source_feeds(id),
  external_id TEXT NOT NULL,
  headline TEXT NOT NULL CHECK(length(trim(headline)) BETWEEN 8 AND 220),
  summary TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL,
  published_at TEXT,
  category TEXT NOT NULL DEFAULT 'football_debate',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','rejected','published')),
  court_id TEXT,
  review_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_feed_id,external_id)
);
CREATE INDEX IF NOT EXISTS idx_debate_candidates_status_created ON debate_candidates(status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_debate_candidates_feed_pub ON debate_candidates(source_feed_id,published_at DESC);

INSERT OR IGNORE INTO debate_source_feeds(id,source_name,feed_url,source_type,enabled,interval_minutes) VALUES
 ('bbc-football','BBC Sport Football','https://feeds.bbci.co.uk/sport/football/rss.xml','rss',1,360),
 ('bbc-premier-league','BBC Sport Premier League','https://feeds.bbci.co.uk/sport/football/premier-league/rss.xml','rss',1,360),
 ('bbc-championship','BBC Sport Championship','https://feeds.bbci.co.uk/sport/football/championship/rss.xml','rss',1,360);
