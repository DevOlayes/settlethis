PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS affiliate_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 3 AND 140),
  category TEXT NOT NULL CHECK (category IN ('shirts_kits','boots_equipment','books_media','fan_experiences','football_services')),
  description TEXT NOT NULL CHECK (length(description) BETWEEN 10 AND 600),
  image_url TEXT,
  destination_url TEXT NOT NULL,
  disclosure_text TEXT NOT NULL CHECK (length(disclosure_text) BETWEEN 20 AND 300),
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','active','paused','ended','archived')),
  internal_notes TEXT,
  created_by INTEGER NOT NULL,
  updated_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS affiliate_item_placements (
  affiliate_id TEXT NOT NULL REFERENCES affiliate_items(id) ON DELETE CASCADE,
  placement_key TEXT NOT NULL REFERENCES sponsor_placement_catalog(placement_key),
  PRIMARY KEY (affiliate_id, placement_key)
);

CREATE TABLE IF NOT EXISTS affiliate_click_events (
  id TEXT PRIMARY KEY,
  affiliate_id TEXT NOT NULL REFERENCES affiliate_items(id) ON DELETE CASCADE,
  placement_key TEXT NOT NULL REFERENCES sponsor_placement_catalog(placement_key),
  event_day TEXT NOT NULL CHECK (length(event_day)=10),
  dedupe_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_affiliate_items_schedule
  ON affiliate_items(status, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_day_item
  ON affiliate_click_events(event_day, affiliate_id, placement_key);
