-- Country-level audience analytics. Store only Cloudflare's two-letter country code;
-- never persist raw IP addresses or precise location.
ALTER TABLE telegram_users ADD COLUMN country_code TEXT;
CREATE INDEX IF NOT EXISTS idx_telegram_users_country ON telegram_users(country_code);

-- One row per member and game; heartbeat upserts are throttled to once per 45 seconds.
CREATE TABLE IF NOT EXISTS game_presence (
  user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id) ON DELETE CASCADE,
  game_key TEXT NOT NULL CHECK(game_key IN ('football_runner','mystery_footballer')),
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,game_key)
);
CREATE INDEX IF NOT EXISTS idx_game_presence_recent ON game_presence(game_key,last_seen_at);
