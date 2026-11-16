-- Personal referral progression. The first tier preserves the existing 3 -> 500 SETHIS reward.
CREATE TABLE IF NOT EXISTS referral_milestone_catalogue (
  milestone_number INTEGER PRIMARY KEY CHECK (milestone_number BETWEEN 1 AND 15),
  qualified_threshold INTEGER NOT NULL UNIQUE CHECK (qualified_threshold > 0),
  reward_amount INTEGER NOT NULL CHECK (reward_amount > 0),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO referral_milestone_catalogue
  (milestone_number,qualified_threshold,reward_amount,title,description)
VALUES
  (1,3,500,'First Three','Bring your first three qualified football fans.'),
  (2,8,750,'Growing Circle','Build your circle to eight qualified members.'),
  (3,15,1000,'Squad Builder','Bring fifteen qualified members into the Court.'),
  (4,25,1500,'Community Starter','Grow your invited community to twenty-five.'),
  (5,50,2500,'Fifty Strong','Reach fifty qualified referrals.'),
  (6,100,4000,'Century Club','Bring one hundred qualified members.'),
  (7,250,7000,'Community Builder','Grow your community to two hundred and fifty.'),
  (8,500,12000,'Supporters Stand','Reach five hundred qualified referrals.'),
  (9,1000,20000,'One Thousand Strong','Bring one thousand qualified members.'),
  (10,2500,35000,'City-Wide Following','Grow your community to two thousand five hundred.'),
  (11,5000,60000,'National Movement','Reach five thousand qualified referrals.'),
  (12,10000,100000,'Ten Thousand Club','Bring ten thousand qualified members.'),
  (13,20000,200000,'The Twenty Thousand Milestone','Help bring twenty thousand qualified members to Settle This!.');

CREATE INDEX IF NOT EXISTS idx_referral_milestones_enabled_threshold
  ON referral_milestone_catalogue(enabled,qualified_threshold);
