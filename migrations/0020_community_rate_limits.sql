CREATE INDEX IF NOT EXISTS idx_court_arguments_user_created ON court_arguments(telegram_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_court_replies_user_created ON court_replies(telegram_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_reporter_created ON moderation_reports(reporter_user_id, created_at DESC);
