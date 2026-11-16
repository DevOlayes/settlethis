PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sponsor_campaigns (
  id TEXT PRIMARY KEY,
  sponsor_name TEXT NOT NULL CHECK (length(trim(sponsor_name)) BETWEEN 2 AND 120),
  campaign_name TEXT NOT NULL CHECK (length(trim(campaign_name)) BETWEEN 3 AND 140),
  headline TEXT NOT NULL CHECK (length(trim(headline)) BETWEEN 3 AND 160),
  body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 5 AND 500),
  creative_image_url TEXT,
  destination_url TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','scheduled','active','paused','ended','archived')),
  internal_notes TEXT NOT NULL DEFAULT '',
  created_by INTEGER NOT NULL REFERENCES admin_users(id),
  updated_by INTEGER NOT NULL REFERENCES admin_users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (julianday(ends_at) > julianday(starts_at))
);

CREATE INDEX IF NOT EXISTS idx_sponsor_campaigns_status_schedule
  ON sponsor_campaigns(status, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS sponsor_placement_catalog (
  placement_key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO sponsor_placement_catalog
  (placement_key,label,description) VALUES
  ('home_feed','Home feed','Clearly labelled sponsored placement within the home discussion feed'),
  ('court_detail','Court detail','Clearly labelled sponsor placement on a Court detail screen'),
  ('match_centre','Match centre','Clearly labelled sponsor placement within a match experience'),
  ('competition_hub','Competition hub','Clearly labelled sponsor placement on a competition page');

CREATE TABLE IF NOT EXISTS sponsor_campaign_placements (
  campaign_id TEXT NOT NULL REFERENCES sponsor_campaigns(id) ON DELETE CASCADE,
  placement_key TEXT NOT NULL REFERENCES sponsor_placement_catalog(placement_key),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (campaign_id, placement_key)
);

CREATE INDEX IF NOT EXISTS idx_sponsor_campaign_placements_key
  ON sponsor_campaign_placements(placement_key, campaign_id);
