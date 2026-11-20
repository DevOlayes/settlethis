CREATE TABLE IF NOT EXISTS telegram_bot_members (
  telegram_user_id TEXT PRIMARY KEY,
  username TEXT,
  first_name TEXT NOT NULL DEFAULT '',
  broadcast_opt_in INTEGER NOT NULL DEFAULT 0 CHECK (broadcast_opt_in IN (0,1)),
  pending_start_payload TEXT,
  start_payload TEXT,
  started_at TEXT,
  stopped_at TEXT,
  last_interaction_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_telegram_bot_members_broadcast
  ON telegram_bot_members(broadcast_opt_in, started_at);

CREATE INDEX IF NOT EXISTS idx_telegram_bot_members_pending_payload
  ON telegram_bot_members(telegram_user_id, pending_start_payload);

CREATE TABLE IF NOT EXISTS telegram_bot_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  bot_username TEXT NOT NULL DEFAULT '',
  webhook_configured_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO telegram_bot_settings(id,bot_username) VALUES(1,'');
