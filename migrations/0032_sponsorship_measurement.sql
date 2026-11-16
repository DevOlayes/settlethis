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
