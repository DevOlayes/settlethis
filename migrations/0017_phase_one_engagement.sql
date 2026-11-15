ALTER TABLE telegram_users ADD COLUMN club TEXT;
ALTER TABLE telegram_users ADD COLUMN country TEXT;
ALTER TABLE telegram_users ADD COLUMN bio TEXT;

CREATE TABLE IF NOT EXISTS task_catalog (
  task_key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_token TEXT NOT NULL CHECK (reward_token IN ('CT','SETHIS')),
  reward_amount INTEGER NOT NULL CHECK (reward_amount > 0),
  destination_url TEXT,
  verification_method TEXT NOT NULL DEFAULT 'manual' CHECK (verification_method IN ('manual','referral','ad')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO task_catalog(task_key,title,description,reward_token,reward_amount,verification_method) VALUES
 ('telegram_channel','Join our Telegram channel','Follow the official Settle This! Telegram channel.','SETHIS',150,'manual'),
 ('facebook_follow','Follow us on Facebook','Follow the official Settle This! Facebook page.','SETHIS',100,'manual'),
 ('whatsapp_community','Join our WhatsApp community','Join the official Settle This! WhatsApp community.','SETHIS',70,'manual'),
 ('invite_three','Invite 3 football friends','Earn the milestone reward when three invited friends complete onboarding.','SETHIS',500,'referral');

CREATE TABLE IF NOT EXISTS task_claims (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id) ON DELETE CASCADE,
  task_key TEXT NOT NULL REFERENCES task_catalog(task_key),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  evidence TEXT,
  reviewed_by INTEGER REFERENCES admin_users(id),
  review_note TEXT,
  reward_ledger_key TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  UNIQUE(user_id,task_key)
);
CREATE INDEX IF NOT EXISTS idx_task_claims_status_created ON task_claims(status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_claims_user ON task_claims(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS referral_codes (
  code TEXT PRIMARY KEY,
  inviter_user_id TEXT NOT NULL UNIQUE REFERENCES telegram_users(telegram_user_id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  invitee_user_id TEXT NOT NULL UNIQUE REFERENCES telegram_users(telegram_user_id) ON DELETE CASCADE,
  inviter_user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL REFERENCES referral_codes(code),
  attributed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  qualified_at TEXT,
  CHECK (invitee_user_id <> inviter_user_id)
);
CREATE INDEX IF NOT EXISTS idx_referrals_inviter ON referrals(inviter_user_id,qualified_at);
CREATE TABLE IF NOT EXISTS referral_rewards (
  id TEXT PRIMARY KEY,
  inviter_user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id),
  milestone INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  ledger_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(inviter_user_id,milestone)
);

CREATE TABLE IF NOT EXISTS ad_reward_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL UNIQUE,
  telegram_user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id),
  placement TEXT NOT NULL CHECK (placement IN ('home_ct','tasks_sethis')),
  reward_token TEXT NOT NULL CHECK (reward_token IN ('CT','SETHIS')),
  reward_amount INTEGER NOT NULL CHECK (reward_amount > 0),
  event_type TEXT NOT NULL,
  zone_id TEXT,
  estimated_price TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ad_reward_user_created ON ad_reward_events(telegram_user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS moderation_reports (
  id TEXT PRIMARY KEY,
  reporter_user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id),
  target_type TEXT NOT NULL CHECK (target_type IN ('user','court','argument','reply')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','actioned','dismissed')),
  reviewed_by INTEGER REFERENCES admin_users(id),
  review_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_status ON moderation_reports(status,created_at DESC);
CREATE TABLE IF NOT EXISTS user_restrictions (
  user_id TEXT PRIMARY KEY REFERENCES telegram_users(telegram_user_id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active','restricted','suspended')),
  reason TEXT NOT NULL,
  expires_at TEXT,
  updated_by INTEGER NOT NULL REFERENCES admin_users(id),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id TEXT PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES admin_users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at DESC);
