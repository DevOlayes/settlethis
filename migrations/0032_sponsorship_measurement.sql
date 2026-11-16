PRAGMA foreign_keys = ON;

-- Privacy-conscious, deduplicated sponsor activity. No member ID, IP address,
-- user agent, or raw browser-session token is retained.
CREATE TABLE IF NOT EXISTS sponsor_events (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES sponsor_campaigns(id) ON DELETE CASCADE,
  placement_key TEXT NOT NULL REFERENCES sponsor_placement_catalog(placement_key),
  event_type TEXT NOT NULL CHECK (event_type IN ('impression','click')),
  event_day TEXT NOT NULL CHECK (length(event_day)=10),
  dedupe_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sponsor_events_day_campaign
  ON sponsor_events(event_day, campaign_id, placement_key, event_type);

CREATE INDEX IF NOT EXISTS idx_sponsor_events_campaign_day
  ON sponsor_events(campaign_id, event_day);

-- Short-lived, daily-rotated HMAC IP digests provide a coarse abuse ceiling.
-- Raw IP addresses are never stored; old digests are expired by the event route.
CREATE TABLE IF NOT EXISTS sponsor_event_rate_limits (
  ip_hash TEXT NOT NULL,
  event_day TEXT NOT NULL,
  event_count INTEGER NOT NULL DEFAULT 0 CHECK (event_count BETWEEN 0 AND 180),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ip_hash, event_day)
);
