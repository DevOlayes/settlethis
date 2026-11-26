-- Official social destinations and return-visit verification for community missions.
UPDATE task_catalog SET destination_url='https://t.me/settlethisofficial',active=1,updated_at=CURRENT_TIMESTAMP WHERE task_key='telegram_channel';
UPDATE task_catalog SET destination_url='https://www.facebook.com/share/1CQ1Pwt9ou/',active=1,updated_at=CURRENT_TIMESTAMP WHERE task_key='facebook_follow';
UPDATE task_catalog SET destination_url='https://whatsapp.com/channel/0029Vb9DFYM9MF8u4aun8F0b',active=1,updated_at=CURRENT_TIMESTAMP WHERE task_key='whatsapp_community';

INSERT OR IGNORE INTO task_catalog(task_key,title,description,reward_token,reward_amount,verification_method,active)
VALUES
 ('x_follow','Follow us on X','Follow the official SETHIS account on X.','SETHIS',100,'manual',0),
 ('instagram_follow','Follow us on Instagram','Follow the official SETHIS account on Instagram.','SETHIS',100,'manual',0),
 ('youtube_subscribe','Subscribe on YouTube','Subscribe to the official SETHIS YouTube channel.','SETHIS',100,'manual',0);

CREATE TABLE IF NOT EXISTS social_task_visits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES telegram_users(telegram_user_id) ON DELETE CASCADE,
  task_key TEXT NOT NULL REFERENCES task_catalog(task_key) ON DELETE CASCADE,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  departed_at TEXT,
  returned_at TEXT,
  claim_cooldown_started_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_social_task_visits_user_task
  ON social_task_visits(user_id,task_key,started_at DESC);
