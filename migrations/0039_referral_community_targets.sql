CREATE TABLE IF NOT EXISTS referral_community_targets (
  target_number INTEGER PRIMARY KEY CHECK (target_number BETWEEN 1 AND 20),
  qualified_threshold INTEGER NOT NULL UNIQUE CHECK (qualified_threshold > 0),
  title TEXT NOT NULL,
  reward_title TEXT NOT NULL DEFAULT 'Community reward to be announced',
  reward_description TEXT NOT NULL DEFAULT 'Campaign reward terms will be published before activation.',
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0,1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO referral_community_targets (target_number,qualified_threshold,title,reward_title,reward_description) VALUES
 (1,1000,'First Thousand','Community reward to be announced','The Settle This! team will publish the reward and eligibility terms before activation.'),
 (2,5000,'Five Thousand Strong','Community reward to be announced','The Settle This! team will publish the reward and eligibility terms before activation.'),
 (3,10000,'Ten Thousand Community','Community reward to be announced','The Settle This! team will publish the reward and eligibility terms before activation.'),
 (4,20000,'Twenty Thousand Community','Community reward to be announced','The Settle This! team will publish the reward and eligibility terms before activation.'),
 (5,50000,'Fifty Thousand Community','Community reward to be announced','The Settle This! team will publish the reward and eligibility terms before activation.'),
 (6,100000,'One Hundred Thousand Community','Community reward to be announced','The Settle This! team will publish the reward and eligibility terms before activation.');
CREATE INDEX IF NOT EXISTS idx_referral_community_enabled_threshold ON referral_community_targets(enabled,qualified_threshold);