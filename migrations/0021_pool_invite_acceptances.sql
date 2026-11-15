CREATE TABLE IF NOT EXISTS pool_invite_acceptances (
  id TEXT PRIMARY KEY,
  invite_id TEXT NOT NULL REFERENCES pool_invites(id) ON DELETE CASCADE,
  pool_id TEXT NOT NULL REFERENCES pool_courts(id) ON DELETE CASCADE,
  inviter_user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id),
  invitee_user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id),
  side TEXT NOT NULL CHECK (side IN ('A','B')),
  accepted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (inviter_user_id <> invitee_user_id),
  UNIQUE(invite_id, invitee_user_id),
  UNIQUE(pool_id, invitee_user_id)
);
CREATE INDEX IF NOT EXISTS idx_pool_invite_acceptances_inviter ON pool_invite_acceptances(inviter_user_id, accepted_at DESC);
CREATE INDEX IF NOT EXISTS idx_pool_invite_acceptances_pool ON pool_invite_acceptances(pool_id, accepted_at DESC);
