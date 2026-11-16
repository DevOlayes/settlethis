PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('account','wallet','court','rewards','technical','safety','other')),
  subject TEXT NOT NULL CHECK(length(trim(subject)) BETWEEN 4 AND 120),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','waiting_member','resolved')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_message_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_updated
  ON support_tickets(user_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_updated
  ON support_tickets(status,updated_at DESC);

CREATE TABLE IF NOT EXISTS support_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK(sender_type IN ('member','admin')),
  sender_id TEXT NOT NULL,
  body TEXT NOT NULL CHECK(length(trim(body)) BETWEEN 1 AND 2000),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_created
  ON support_messages(ticket_id,created_at ASC);
