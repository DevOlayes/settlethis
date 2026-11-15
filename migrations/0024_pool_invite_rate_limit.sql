CREATE INDEX IF NOT EXISTS idx_pool_invites_inviter_pool_created ON pool_invites(inviter_user_id,pool_id,created_at DESC);
