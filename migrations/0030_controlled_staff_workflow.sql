PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS editorial_staff (
  telegram_user_id TEXT PRIMARY KEY REFERENCES telegram_users(telegram_user_id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('host','editor')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended')),
  created_by INTEGER NOT NULL REFERENCES admin_users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_editorial_staff_role_status ON editorial_staff(role,status);

CREATE TABLE IF NOT EXISTS matchday_content_proposals (
  id TEXT PRIMARY KEY,
  submitted_by TEXT NOT NULL REFERENCES telegram_users(telegram_user_id) ON DELETE CASCADE,
  fixture_id TEXT NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  proposal_type TEXT NOT NULL DEFAULT 'match_poll' CHECK(proposal_type='match_poll'),
  payload TEXT NOT NULL CHECK(json_valid(payload)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  reviewed_by INTEGER REFERENCES admin_users(id),
  review_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_matchday_proposals_status_created ON matchday_content_proposals(status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matchday_proposals_submitter ON matchday_content_proposals(submitted_by,created_at DESC);

CREATE TABLE IF NOT EXISTS editorial_staff_audit (
  id TEXT PRIMARY KEY,
  telegram_user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_editorial_staff_audit_user ON editorial_staff_audit(telegram_user_id,created_at DESC);
