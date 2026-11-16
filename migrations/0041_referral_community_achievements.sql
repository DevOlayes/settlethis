CREATE TABLE IF NOT EXISTS referral_community_achievements (
  target_number INTEGER PRIMARY KEY REFERENCES referral_community_targets(target_number),
  qualified_count INTEGER NOT NULL,
  achieved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
